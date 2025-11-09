import requests
from dotenv import load_dotenv
import os

load_dotenv()

address = input("Enter your address: ")
api_key = os.getenv("MAP_API")

url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={api_key}"
response = requests.get(url).json()

if response['status'] == 'OK':
    location = response['results'][0]['geometry']['location']
    lat, lng = location['lat'], location['lng']
    print(lat, lng)

place_url = (
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json?"
    f"location={lat},{lng}&radius=5000&type=car_dealer&keyword=Toyota dealership&key={api_key}"
)

place_response = requests.get(place_url).json()

dealerships = []
for place in place_response.get('results', []):
    dealerships.append({
        'name': place['name'],
        'address': place.get('vicinity'),
        'rating': place.get('rating'),
        'place_id': place.get('place_id')
    })

print(dealerships)