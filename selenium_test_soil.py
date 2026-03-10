import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

def run_soil_test():
    # Setup Chrome options
    chrome_options = Options()
    
    # Initialize the WebDriver
    print("Initializing WebDriver...")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    # Maximize the window to ensure desktop navigation is visible
    driver.maximize_window()
    
    try:
        # Get the absolute path to index.html
        base_path = os.path.dirname(os.path.abspath(__file__))
        index_path = f"file:///{os.path.join(base_path, 'index.html').replace(os.sep, '/')}"
        
        # 1. Open the NutriRoot website home page
        print(f"Opening Home Page: {index_path}")
        driver.get(index_path)
        
        # Wait for page to load
        time.sleep(3)
        
        # 2. Navigate to the Login page (via modal)
        print("Opening login modal...")
        login_btn = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CLASS_NAME, "btn-nav-login"))
        )
        login_btn.click()
        
        # Wait for login card to appear
        WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.ID, "loginCard"))
        )
        
        # 3. Enter credentials
        print("Entering credentials...")
        email_input = driver.find_element(By.ID, "loginEmail")
        email_input.send_keys("alphonsaauguestine2028@mca.ajce.in")
        
        password_input = driver.find_element(By.ID, "loginPassword")
        password_input.send_keys("098765")
        
        # 4. Click the Login button
        print("Submitting login form...")
        login_form = driver.find_element(By.ID, "loginForm")
        login_form.submit()
        
        # 5. Verify redirection to the dashboard
        print("Waiting for dashboard redirection...")
        WebDriverWait(driver, 15).until(
            EC.url_contains("dashboard.html")
        )
        print(f"Current URL: {driver.current_url}")
        print("Successfully logged in and reached the dashboard.")
        
        # 6. Navigate to the Soil Input page
        print("Navigating to Soil Input page (soil.html)...")
        soil_page_url = f"file:///{os.path.join(base_path, 'soil.html').replace(os.sep, '/')}"
        driver.get(soil_page_url)
        
        # 7. Automatically enter soil parameters
        print("Filling soil data form...")
        WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.ID, "soilForm"))
        )
        
        # Fill Nutrient Levels (NPK)
        driver.find_element(By.ID, "nitrogen").send_keys("45.5")
        driver.find_element(By.ID, "phosphorus").send_keys("32.0")
        driver.find_element(By.ID, "potassium").send_keys("38.5")
        
        # Fill Soil Properties
        driver.find_element(By.ID, "ph").send_keys("6.8")
        driver.find_element(By.ID, "moisture").send_keys("42")
        driver.find_element(By.ID, "temperature").send_keys("27.5")
        
        # Fill Crop Type (Soil Type as requested)
        crop_select = Select(driver.find_element(By.ID, "crop"))
        crop_select.select_by_visible_text("Rice")
        
        # 8. Submit the soil data
        print("Submitting soil data...")
        soil_form = driver.find_element(By.ID, "soilForm")
        soil_form.submit()
        
        # Wait for form to process and land on dashboard
        WebDriverWait(driver, 15).until(
            EC.url_contains("dashboard.html")
        )
        print("Soil data submitted successfully.")
        
        # 9. Navigate to the Recommendation page
        print("Navigating to Recommendation page...")
        rec_page_url = f"file:///{os.path.join(base_path, 'recommendation.html').replace(os.sep, '/')}"
        driver.get(rec_page_url)
        
        # 10. Verify that the recommended fertilizer is displayed
        print("Verifying recommendations...")
        WebDriverWait(driver, 15).until(
            EC.visibility_of_element_located((By.ID, "recommendationsList"))
        )
        
        # Check for existence of recommendation cards
        recommendations = driver.find_elements(By.CLASS_NAME, "recommendation-card")
        if len(recommendations) > 0:
            print("SUCCESS: Fertilizer recommendations appear successfully!")
            for i, rec in enumerate(recommendations, 1):
                title = rec.find_element(By.CLASS_NAME, "rec-title").text
                print(f" - Recommendation {i}: {title}")
        else:
            # Check for "excellent condition" message which might have no synthetic fertilizer recs
            summary_text = driver.find_element(By.ID, "recommendationsList").text
            if "excellent" in summary_text.lower() or "optimal" in summary_text.lower():
                print("SUCCESS: Soil is in optimal condition, advice displayed successfully!")
            else:
                print("WARNING: Recommendations list found but no specific fertilizer cards visible.")
        
        # Final observation wait
        time.sleep(5)
        
    except Exception as e:
        print(f"An error occurred: {e}")
        # Take a screenshot on failure
        driver.save_screenshot("test_soil_error.png")
        print("Screenshot saved as test_soil_error.png")
    finally:
        # Close the browser
        print("Closing browser...")
        driver.quit()

if __name__ == "__main__":
    run_soil_test()
