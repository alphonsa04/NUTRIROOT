# NutriRoot: First Python Test script
# This script simulates a simple soil analysis logic.

def analyze_soil(nitrogen, phosphorus, potassium):
    """
    Simulates a smart recommendation based on N-P-K levels.
    """
    print(f"--- NutriRoot Analysis ---")
    print(f"Nitrogen (N): {nitrogen}")
    print(f"Phosphorus (P): {phosphorus}")
    print(f"Potassium (K): {potassium}")
    
    recommendations = []
    
    if nitrogen < 30:
        recommendations.append("Low Nitrogen: Apply Urea or Ammonium Nitrate.")
    if phosphorus < 20:
        recommendations.append("Low Phosphorus: Apply Bone Meal or Superphosphate.")
    if potassium < 20:
        recommendations.append("Low Potassium: Apply Potash.")
        
    if not recommendations:
        return "Soil health is optimal. No fertilizer needed."
    else:
        return "\n".join(recommendations)

# Test run with sample data
if __name__ == "__main__":
    # Simulating a reading from a sensor or user input
    n_reading = 25
    p_reading = 40
    k_reading = 15
    
    result = analyze_soil(n_reading, p_reading, k_reading)
    
    print("\n--- SYSTEM RECOMMENDATION ---")
    print(result)
    print("----------------------------")
