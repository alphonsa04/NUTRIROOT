import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def run_crop_test():
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
        
        # 5. Verify Successful Redirection to Dashboard
        print("Waiting for dashboard redirection...")
        WebDriverWait(driver, 15).until(
            EC.url_contains("dashboard.html")
        )
        print(f"Current URL: {driver.current_url}")
        print("Successfully logged in and reached the Dashboard.")
        
        # 6. Navigate to the Crop Recommendation page
        print("Navigating to Crop Recommendation page (crops.html)...")
        crops_page_url = f"file:///{os.path.join(base_path, 'crops.html').replace(os.sep, '/')}"
        driver.get(crops_page_url)
        
        # 7. Enter soil input data
        print("Filling crop suggestion form...")
        WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.ID, "cropsSoilForm"))
        )
        
        # Input Nitrogen, Phosphorus, Potassium
        driver.find_element(By.ID, "crops_nitrogen").send_keys("120")
        driver.find_element(By.ID, "crops_phosphorus").send_keys("45")
        driver.find_element(By.ID, "crops_potassium").send_keys("60")
        
        # Input pH
        driver.find_element(By.ID, "crops_ph").send_keys("6.5")
        
        # The moisture and temperature fields are hidden inputs (integrated with gauges)
        # We'll set them via JavaScript for the test
        print("Setting Moisture and Temperature via JS...")
        driver.execute_script("document.getElementById('crops_moisture').value = '45';")
        driver.execute_script("document.getElementById('crops_temperature').value = '28';")
        
        # 8. Click the "Analyze & Get Crop Suggestions" button
        print("Clicking 'Analyze & Get Crop Suggestions'...")
        submit_btn = driver.find_element(By.CSS_SELECTOR, "#cropsSoilForm button[type='submit']")
        driver.execute_script("arguments[0].scrollIntoView();", submit_btn)
        time.sleep(1)
        submit_btn.click()
        
        # 9. Verify that the recommended crops section appears
        print("Waiting for crop recommendations to appear...")
        # Note: The results are injected into #cropSuggestionsContainer
        WebDriverWait(driver, 15).until(
            EC.visibility_of_element_located((By.ID, "cropSuggestionsContainer"))
        )
        
        # 10. Validate that at least one crop recommendation is displayed
        time.sleep(3) # Give partial time for rendering
        results = driver.find_elements(By.CLASS_NAME, "crop-match-card")
        
        if len(results) > 0:
            print(f"SUCCESS: {len(results)} crop recommendation(s) displayed successfully!")
            for i, result in enumerate(results, 1):
                try:
                    crop_name = result.find_element(By.TAG_NAME, "h3").text
                    match_score = result.find_element(By.XPATH, ".//span[contains(text(), '%')]").text
                    print(f" - Suggestion {i}: {crop_name} (Match: {match_score})")
                except Exception as inner_e:
                    print(f" - Suggestion {i}: [Details hidden or formatted differently]")
        else:
            print("FAILURE: No crop recommendations found in the container.")
            # Take a screenshot on failure to see what happened
            driver.save_screenshot("crop_test_missing_results.png")
            
        print("Final observation for 5 seconds...")
        time.sleep(5)
        
    except Exception as e:
        print(f"An error occurred: {e}")
        # Take a screenshot on failure
        driver.save_screenshot("selenium_crop_test_failure.png")
        print("Screenshot saved as selenium_crop_test_failure.png")
    finally:
        # Close the browser
        print("Closing browser...")
        driver.quit()

if __name__ == "__main__":
    run_crop_test()
