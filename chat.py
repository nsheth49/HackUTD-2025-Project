import os
import json
from flask import Blueprint, jsonify
import google.generativeai as genai
from firebase_tools import (
    find_cars,
    get_financial_information,
    find_toyota_dealerships,
    financialPlan
)


main = Blueprint('main', __name__)

# # Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)
# Define tools/functions for Gemini
tools = [
    {
        "function_declarations": [
            {
                "name": "get_financial_information",
                "description": "Get financial information for a user including credit score, income, and savings",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_id": {
                            "type": "string",
                            "description": "The unique identifier for the user"
                        }
                    },
                    "required": ["user_id"]
                }
            },
            {
                "name": "find_cars",
                "description": "Search for Toyota cars based on criteria",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "car_type": {
                            "type": "string",
                            "description": "Type of car (sedan, SUV, truck, etc.)"
                        },
                        "max_price": {
                            "type": "number",
                            "description": "Maximum price in dollars"
                        },
                        "make_year": {
                            "type": "integer",
                            "description": "Year of manufacture"
                        },
                        "powertrain": {
                            "type": "string",
                            "description": "Powertrain type (gas, hybrid, electric)"
                        }
                    }
                }
            },
            {
                "name": "find_toyota_dealerships",
                "description": "Find Toyota dealerships near a location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "address": {
                            "type": "string",
                            "description": "The address or location to search near"
                        },
                        "radius": {
                            "type": "number",
                            "description": "Search radius in meters (default 8000)"
                        }
                    },
                    "required": ["address"]
                }
            },
            {
                "name": "financialPlan",
                "description": "Calculate financing or leasing payment plan",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "typeOfPayment": {
                            "type": "string",
                            "description": "Type of payment plan (finance or lease)"
                        },
                        "userId": {
                            "type": "string",
                            "description": "User identifier"
                        },
                        "price": {
                            "type": "array",
                            "items": {"type": "number"},
                            "description": "Price parameters for the calculation"
                        }
                    },
                    "required": ["typeOfPayment", "userId", "price"]
                }
            }
        ]
    }
]

@main.route("/api/chat", methods=['GET'])
def call_tool(tool_name, args):
    """Execute the appropriate tool based on name and arguments"""
    try:
        if tool_name == "get_financial_information":
            return get_financial_information(args["user_id"])
        elif tool_name == "find_cars":
            return find_cars(
                car_type=args.get("car_type"),
                max_price=args.get("max_price"),
                make_year=args.get("make_year"),
                powertrain=args.get("powertrain")
            )
        elif tool_name == "find_toyota_dealerships":
            return find_toyota_dealerships(
                address=args["address"],
                radius=args.get("radius", 8000)
            )
        elif tool_name == "financialPlan":
            return financialPlan(
                args["typeOfPayment"],
                args["userId"],
                *args["price"]
            )
        else:
            return {"error": f"Unknown tool {tool_name}"}
    except Exception as e:
        return {"error": f"Tool execution failed: {str(e)}"}

# Initialize the model with tools
model = genai.GenerativeModel(
    model_name="gemini-2.5-pro",
    tools=tools,
    system_instruction=(
        "You are a Toyota car purchasing assistant. Your goal is to help users find the perfect Toyota vehicle along with the exact model and year.\n\n"
        "CONVERSATION FLOW:\n"
        "1. First, gather essential information by asking questions one at a time:\n"
        "   - What type of vehicle are they interested in? (sedan, SUV, truck, hybrid, etc.)\n"
        "   - What is their budget or price range?\n"
        "   - What year/model preferences do they have?\n"
        "   - What powertrain do they prefer? (gas, hybrid, electric)\n"
        "   - Any other specific features or requirements?\n\n"
        "2. ONLY call the find_cars tool AFTER you have collected:\n"
        "   - At minimum: vehicle type OR price range\n"
        "   - Ideally: vehicle type, price range, and powertrain preference\n\n"
        "3. If the user asks about financing:\n"
        "   - Ask for their user_id\n"
        "   - Call get_financial_information to retrieve their financial details\n"
        "   - Use financialPlan to calculate payment options\n\n"
        "4. Once a car is selected, offer to find nearby dealerships using find_toyota_dealerships\n\n"
        "Be conversational, helpful, and patient. Ask follow-up questions to clarify preferences. "
        "Don't rush to search for cars until you understand what the user needs."
    )
)

# Start a chat session
chat = model.start_chat(history=[])

print("Toyota Car Purchasing Assistant")
print("=" * 50)
print("Hello! I'm here to help you find the perfect Toyota. Type 'exit' to quit.\n")

# Initial greeting from assistant
try:
    response = chat.send_message("I want to buy a new Toyota.")
    print(f"[Assistant]: {response.text}\n")
except Exception as e:
    print(f"Error: {e}")

# Main conversation loop
while True:
    try:
        # Get user input
        user_input = input("[You]: ").strip()
        
        if user_input.lower() in ["exit", "quit", "bye"]:
            print("\n[Assistant]: Thank you for using the Toyota purchasing assistant. Good luck with your car search!")
            break
        
        if not user_input:
            continue
        
        # Send message to Gemini
        response = chat.send_message(user_input)
        
        # Handle function calls
        while response.candidates[0].content.parts:
            part = response.candidates[0].content.parts[0]
            
            # Check if it's a function call
            if hasattr(part, 'function_call') and part.function_call:
                function_call = part.function_call
                tool_name = function_call.name
                args = dict(function_call.args)
                
                print(f"\n[Tool Call]: {tool_name}")
                print(f"[Arguments]: {json.dumps(args, indent=2)}")
                
                # Execute the tool
                result = call_tool(tool_name, args)
                print(f"[Tool Result]: {json.dumps(result, indent=2)}\n")
                
                # Send tool result back to Gemini
                response = chat.send_message(
                    genai.protos.Content(
                        parts=[genai.protos.Part(
                            function_response=genai.protos.FunctionResponse(
                                name=tool_name,
                                response={"result": result}
                            )
                        )]
                    )
                )
            else:
                # It's a text response
                if response.text:
                    print(f"\n[Assistant]: {response.text}\n")
                break
    
    except KeyboardInterrupt:
        print("\n\n[Assistant]: Goodbye!")
        break
    except Exception as e:
        print(f"\n[Error]: {str(e)}\n")
        continue
