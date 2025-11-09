# firebase_tools.py
import firebase_admin
from firebase_admin import firestore, credentials
import os
from dotenv import load_dotenv
from langchain.tools import tool
import requests

load_dotenv()

SERVICE_ACCOUNT_KEY_PATH = os.getenv("SERVICE_ACCOUNT_KEY_PATH")
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")
MAP_API_KEY = os.getenv("MAP_API")

db_client = None

def initialize_firebase_sdk():
    """Initializes Firebase app with credentials."""
    try:
        firebase_admin.get_app()
    except ValueError:
        try:
            cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
            firebase_admin.initialize_app(cred, {'projectId': FIREBASE_PROJECT_ID})
            print("Firebase Admin SDK initialized successfully!")
        except FileNotFoundError:
            print(f"Service account key not found at {SERVICE_ACCOUNT_KEY_PATH}")
            exit(1)
        except Exception as e:
            print(f"Error initializing Firebase Admin SDK: {e}")
            exit(1)

def get_firestore_client():
    """Returns Firestore client (singleton)."""
    global db_client
    if db_client is None:
        initialize_firebase_sdk()
        db_client = firestore.client()
    return db_client

@tool("cars_finder", description="Extracts cars from Firestore database based on user preferences.")
def find_cars(car_type: str, max_price: int, make_year: str, powertrain: str) -> list:
    """Query 'cars' collection with criteria."""
    try:
        db = get_firestore_client()
        query_ref = db.collection('cars')

        if car_type:
            query_ref = query_ref.where("car_type", "array_contains", car_type)
        if make_year:
            query_ref = query_ref.where("make_year", "==", make_year)
        if powertrain:
            query_ref = query_ref.where("powertrain", "==", powertrain)
        if max_price is not None:
            query_ref = query_ref.where("price", "<=", max_price)

        docs = query_ref.stream()
        return [dict(doc.to_dict(), id=doc.id) for doc in docs]

    except Exception as e:
        print(f"Error finding cars: {e}")
        return []

@tool("get_financial_information", description="Gets financial info for a user by user_id.")
def get_financial_information(user_id: str) -> dict:
    """Fetch financial info for user from Firestore."""
    try:
        db = get_firestore_client()
        financial_ref = db.collection('users').document(user_id).collection('financial')
        for doc in financial_ref.stream():
            data = doc.to_dict()
            return {
                "annual_income": data.get("annualIncome"),
                "debt_to_income_ratio": data.get("debtToIncomeRatio"),
                "credit_score": data.get("creditScore"),
                "user_id": user_id
            }
    except Exception as e:
        print(f"Error fetching financial data: {e}")
    return {}

@tool("find_toyota_dealerships", description="Finds nearby Toyota dealerships for a given address.")
def find_toyota_dealerships(address: str, radius: int = 8000) -> dict:
    """Uses Google Maps API to locate nearby Toyota dealerships."""
    try:
        # Geocode address
        geocode_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={MAP_API_KEY}"
        geocode_response = requests.get(geocode_url).json()
        if geocode_response.get("status") != "OK":
            return {"error": "Geocoding failed"}

        loc = geocode_response["results"][0]["geometry"]["location"]
        lat, lng = loc["lat"], loc["lng"]

        # Nearby Toyota dealerships
        place_url = (
            f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?"
            f"location={lat},{lng}&radius={radius}&type=car_dealer&keyword=Toyota dealership&key={MAP_API_KEY}"
        )
        place_response = requests.get(place_url).json()
        dealerships = [
            {
                "name": p.get("name"),
                "address": p.get("vicinity"),
                "rating": p.get("rating"),
                "place_id": p.get("place_id"),
                "location": p.get("geometry", {}).get("location", {})
            }
            for p in place_response.get("results", [])
        ]

        return {"query_location": {"latitude": lat, "longitude": lng},
                "dealerships_found": len(dealerships),
                "dealerships": dealerships}

    except Exception as e:
        return {"error": str(e)}

def getInterestRate(creditScore: int) -> float:
    """Returns APR based on credit score."""
    if 760 <= creditScore <= 850: return 0.0499
    if 700 <= creditScore < 760: return 0.0599
    if 650 <= creditScore < 700: return 0.0699
    if 600 <= creditScore < 650: return 0.0899
    if 300 <= creditScore < 600: return 0.1199
    raise ValueError("Invalid credit score")

def financialPlan(typeOfPayment: str, userId: str, *price):
    """Calculates payments based on financing/cash."""
    financial_data = get_financial_information(userId)
    if "cash" in typeOfPayment.lower():
        return {"Total Payment": price[0]}
    creditScore = financial_data["credit_score"]
    if "finance" in typeOfPayment.lower():
        monthlyRate = getInterestRate(creditScore)/12
        total = round(((price[0]-price[1])*monthlyRate)/(1-(1+monthlyRate)**-price[2])*price[2],2) + price[1]
        monthlyPayment = round(((price[0]-price[1])*monthlyRate)/(1-(1+monthlyRate)**-price[2]),2)
        return {"Total Payment": total, "Down Payment": price[1], "Monthly Payment": monthlyPayment}

def all_tools():
    """Returns all available tools for LangChain/Gemini agent."""
    return [find_cars, get_financial_information, find_toyota_dealerships]
