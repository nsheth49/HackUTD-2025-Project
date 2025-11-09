# 0 = total money; 1 = down payment; 2 = time
def financialPlan(typeOfPayment, *price):
    if "cash" in typeOfPayment.lower():
        return {"Total Payment": price[0]}
    else:
        creditScore = int(input("Enter Credit Score: "))
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
