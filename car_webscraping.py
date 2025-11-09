import time
from bs4 import BeautifulSoup
import requests
import pprint 


TOYOTA_URL = "https://www.toyota.com/all-vehicles/"

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
            price = all_headers[0].get_text(strip=True)
            mileages_or_ranges = all_headers[1].get_text(strip=True)  

            make_year = card.find("div", class_="model-year label-01").get_text(strip=True)

            if card.find("div", class_="top-label label-01") == None:
                powertrain = "Gasoline"
            else:
                powertrain = card.find("div", class_="top-label label-01").get_text(strip=True)
            
            car_type = [data for data in card["data-category"].split(",")]

            car_data = {
                "name": name,
                "price": price,
                "mileages_or_ranges": mileages_or_ranges,
                "make_year": make_year,
                "powertrain": powertrain,
                "car_type": car_type
            }
            car_data_list.append(car_data)

        except AttributeError:
            print("Skipping a card with missing data.")
        
        return car_data_list

print(get_model_data(TOYOTA_URL))

