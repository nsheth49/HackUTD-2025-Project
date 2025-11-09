import firebase_admin
from firebase_admin import firestore
from firebase_admin import credentials
import os
from dotenv import load_dotenv
from langchain.tools import tool
import requests


load_dotenv()


SERVICE_ACCOUNT_KEY_PATH = os.getenv("SERVICE_ACCOUNT_KEY_PATH")
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")
DATABASE_URL = f'https://{FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/'
MAP_API_KEY = os.getenv("MAP_API")


def initialize_firebase_sdk():
   """
   Initializes the Firebase app.
   Checks if the app is already initialized to prevent errors.
   Sets up credentials for Firestore.
   """
   try:
       # Check if the default app is already initialized
       firebase_admin.get_app()
   except ValueError:
       print("Initializing Firebase App...")
       try:
           cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
           firebase_admin.initialize_app(cred, {
               'projectId': FIREBASE_PROJECT_ID,
           })
           print("Firebase Admin SDK initialized successfully!")
       except FileNotFoundError:
           print(f"Error: Service account key file not found at path:")
           print(f"{SERVICE_ACCOUNT_KEY_PATH}")
           exit(1)
       except Exception as e:
           print(f"Error initializing Firebase Admin SDK: {e}")
           exit(1)


db_client = None




def get_firestore_client():
   """
   Returns a Firestore client instance using a singleton pattern.
   Ensures Firebase is initialized only ONCE.
   """
   global db_client


   if db_client is None:
       initialize_firebase_sdk()
       db_client = firestore.client()


   return db_client




def find_cars(car_type: str, max_price: int, make_year: str, powertrain: str) -> dict:
   """
   Queries the Firestore 'cars' collection based on specified criteria.
   This function is designed to be the "tool" an AI can call.


   Args:
       car_type (str, optional): The type of car (e.g., "Trucks", "SUV").
       max_price (int, optional): The maximum price. Assumes 'price' is a number.
       make_year (str, optional): The make year (e.g., "2025").
       powertrain (str, optional): The powertrain type (e.g., "Hybrid EV Available").


   Returns:
       list: A list of dictionaries, where each dictionary is a car
             that matches the criteria.
   """
   try:
       db = get_firestore_client()


       query_ref = db.collection('cars')


       if car_type:
           print(f"[Query] Filtering by car_type array-contains '{car_type}'")
           query_ref = query_ref.where(
               field_path="car_type", op_string="array_contains", value=car_type
           )


       if make_year:
           print(f"[Query] Filtering by make_year == '{make_year}'")
           query_ref = query_ref.where(
               field_path="make_year", op_string="==", value=make_year
           )


       if powertrain:
           print(f"[Query] Filtering by powertrain == '{powertrain}'")
           query_ref = query_ref.where(
               field_path="powertrain", op_string="==", value=powertrain
           )


       if max_price is not None:
           print(f"[Query] Filtering by price <= {max_price}")
           query_ref = query_ref.where(
               field_path="price", op_string="<=", value=max_price
           )


       docs = query_ref.stream()


       matched_cars = []
       for doc in docs:
           car_data = doc.to_dict()
           car_data['id'] = doc.id


           matched_cars.append(car_data)


       print(f"[Result] Found {len(matched_cars)} matching cars.")
       return matched_cars


   except Exception as e:
       print(f"An error occurred while finding cars: {e}")
       return []




def get_financial_information(user_id: str) -> dict:
   """
   Retrieves financial information from Firestore for a given user.
  
   Args:
       user_id (str): The unique user identifier.
  
   Returns:
       dict: A dictionary containing annual_income, debt_to_income_ratio, credit_score, and user_id.
   """
   try:
       db = get_firestore_client()


       # Build the path to the subcollection
       # collection('users') -> document('USER_ID') -> collection('financial')
       financial_ref = db.collection('users').document(user_id).collection('financial')


       # Get all documents from that subcollection
       docs = financial_ref.stream()
       financial_data = {}


       for doc in docs:
           data = doc.to_dict()
           financial_data["annual_income"] = data["annualIncome"]
           financial_data["debt_to_income_ratio"] = data["debtToIncomeRatio"]
           financial_data["credit_score"] = data["creditScore"]
           financial_data["user_id"] = user_id
           return financial_data


   except Exception as e:
       print(f"An error occurred while fetching financial data: {e}")


   return {}


#print(find_cars(car_type="suvs", max_price=60000, make_year="2025", powertrain="Gasoline"))


# 0 = total money; 1 = down payment; 2 = time

def find_toyota_dealerships(address: str, radius: int = 8000) -> dict:
    """
    Uses Google Maps Geocoding + Places API to find nearby Toyota dealerships based on user address.

    Args:
        address (str): The user's address (e.g., '123 Main St, Dallas, TX').
        radius (int, optional): Search radius in meters (default: 8000 = 8 km).

    Returns:
        dict: A dictionary with query location and nearby Toyota dealership info.
    """
    try:
        # Step 1: Convert address → latitude & longitude
        geocode_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={MAP_API_KEY}"
        geocode_response = requests.get(geocode_url).json()

        if geocode_response["status"] != "OK":
            return {"error": f"Geocoding failed: {geocode_response.get('status')}"}

        location = geocode_response["results"][0]["geometry"]["location"]
        lat, lng = location["lat"], location["lng"]

        # Step 2: Find nearby Toyota dealerships
        place_url = (
            "https://maps.googleapis.com/maps/api/place/nearbysearch/json?"
            f"location={lat},{lng}&radius={radius}&type=car_dealer&keyword=Toyota dealership&key={MAP_API_KEY}"
        )
        place_response = requests.get(place_url).json()

        dealerships = []
        for place in place_response.get("results", []):
            dealerships.append({
                "name": place.get("name"),
                "address": place.get("vicinity"),
                "rating": place.get("rating"),
                "place_id": place.get("place_id"),
                "location": place.get("geometry", {}).get("location", {})
            })

        return {
            "query_location": {"latitude": lat, "longitude": lng},
            "dealerships_found": len(dealerships),
            "dealerships": dealerships
        }

    except Exception as e:
        return {"error": str(e)}
    
def getInterestRate(creditScore):
    match creditScore:
            case score if 760 <= score <= 850:  # Exceptional
                return 0.0499   # 4.99% APR
            case score if 700 <= score < 760:   # Very Good
                return 0.0599   # 5.99% APR
            case score if 650 <= score < 700:   # Good
                return 0.0699   # 6.99% APR
            case score if 600 <= score < 650:   # Fair
                return 0.0899   # 8.99% APR
            case score if 300 <= score < 600:   # Poor
                return 0.1199   # 11.99% APR
            case _:  # Default case
                raise ValueError("Invalid credit score")
        
print(find_cars(car_type="suvs", max_price=60000, make_year="2025", powertrain="Gasoline"))
        
def all_tools():
   """Return all tools (async + sync safe for LangChain agent use)."""
   return [find_cars, get_financial_information, find_toyota_dealerships]

def financialPlan(typeOfPayment,userId, *price):
    financial_data = get_financial_information(userId)
    if "cash" in typeOfPayment.lower():
        return {"Total Payment": price[0]}
    else:
        creditScore = financial_data["credit_score"]
        if "finance" in typeOfPayment.lower():
            monthlyInterestRate = getInterestRate(creditScore)/12
            return {"Total Payment": round(((price[0]-price[1])*monthlyInterestRate)/(1-(1+monthlyInterestRate)**-price[2])*price[2],2) + price[1], "Down Payment": price[1], "Monthly Payment": round(((price[0]-price[1])*monthlyInterestRate)/(1-(1+monthlyInterestRate)**-price[2]),2)}
        # if "lease" in typeOfPayment.lower():
        #     cap_cost = price[0] - price[1]  # capitalized cost after down payment
        #     residual = price[0] * 0.55      # assume 55% residual value
        #     money_factor = getInterestRate() / 2400
        #     depreciation_fee = (cap_cost - residual) / price[2]
        #     finance_fee = (cap_cost + residual) * money_factor
        #     monthlyPayment = depreciation_fee + finance_fee
        #     totalPayment = round(monthlyPayment * price[2], 2) + price[1]
        #     return {
        #         "Total Payment": totalPayment,
        #         "Down Payment": price[1],
        #         "Monthly Payment": round(monthlyPayment, 2),
        #         "Residual Value": round(residual, 2)
        #     }