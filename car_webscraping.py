import firebase_admin
from firebase_admin import credentials, firestore
from bs4 import BeautifulSoup
import requests, os
from dotenv import load_dotenv


load_dotenv()
SERVICE_ACCOUNT_KEY_PATH = os.getenv("SERVICE_ACCOUNT_KEY_PATH")


TOYOTA_URL = os.getenv("TOYOTA_URL")


def get_model_data(url):
   response = requests.get(url)
   soup = BeautifulSoup(response.text, "html.parser")
   all_car_cards = soup.find_all("div", class_="vehicle-card")
   print(len(all_car_cards))
   car_data_list = []


   for card in all_car_cards:
       try:
           name = card.find("div", class_="title heading-04").get_text(strip=True)


           meta_div = card.find("div", class_="meta")
           all_headers = meta_div.find_all('div', class_='header body-01')
           price = int(all_headers[0].get_text(strip=True).split("$")[1].replace(',', ''))
           mileages_or_ranges = all_headers[1].get_text(strip=True) 


           make_year = card.find("div", class_="model-year label-01").get_text(strip=True)


           if card.find("div", class_="top-label label-01") == None:
               powertrain = "Gasoline"
           else:
               powertrain = card.find("div", class_="top-label label-01").get_text(strip=True)
          
           car_type = [data for data in card["data-category"].split(",")]
           car_image = card.find("div", class_="image-container").find("picture", class_="tcom-picture").find("img")["src"]


           car_data = {
               "name": name,
               "price": price,
               "mileages_or_ranges": mileages_or_ranges,
               "make_year": make_year,
               "powertrain": powertrain,
               "car_type": car_type,
               "car_image": car_image
           }
           car_data_list.append(car_data)


       except AttributeError:
           print("Skipping a card with missing data.")
      
   return car_data_list




def initialize_firebase():
   cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
   firebase_admin.initialize_app(cred)




def save_car_data(car_data_list):
   db = firestore.client()
   for car_data in car_data_list:
       try:
           doc_ref = db.collection("cars").add(car_data)
           print(f"Added car with ID: {doc_ref[1].id}")
       except Exception as e:
           print(f"Error adding car data: {e}")
   print("Car data saved successfully")




if __name__ == "__main__":
   initialize_firebase()
   save_car_data(get_model_data(TOYOTA_URL))
