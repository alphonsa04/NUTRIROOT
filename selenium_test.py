import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

def run_test():
    # Setup Chrome options
    chrome_options = Options()
    # chrome_options.add_argument("--headless")  # Uncomment to run without a visible window
    
    # Initialize the WebDriver
    print("Initializing WebDriver...")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        # Get the absolute path to index.html
        base_path = os.path.dirname(os.path.abspath(__file__))
        index_path = f"file:///{os.path.join(base_path, 'index.html').replace(os.sep, '/')}"
        
        print(f"Opening: {index_path}")
        driver.get(index_path)
        
        # Give the page some time to load
        time.sleep(3)
        
        # 1. Click the "REGISTER" button to open the login modal
        print("Opening login modal...")
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC

        login_btn = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CLASS_NAME, "btn-nav-login"))
        )
        login_btn.click()
        
        # 2. Switch to login tab (though it seems openAuthModal('login') does this)
        # Ensure login card is visible
        WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.ID, "loginCard"))
        )
        
        # 3. Fill in the email
        print("Entering credentials...")
        email_input = driver.find_element(By.ID, "loginEmail")
        email_input.send_keys("alphonsaauguestine0406@gmail.com")
        
        # 4. Fill in the password
        password_input = driver.find_element(By.ID, "loginPassword")
        password_input.send_keys("234567")
        
        # 5. Submit the form
        print("Submitting login form...")
        login_form = driver.find_element(By.ID, "loginForm")
        login_form.submit()
        
        # 6. Wait for dashboard redirection
        print("Waiting for dashboard redirection...")
        WebDriverWait(driver, 15).until(
            EC.url_contains("dashboard.html")
        )
        
        print(f"Current URL: {driver.current_url}")
        print("Success! Logged in and reached the user dashboard.")
        
        # Wait a bit to observe
        time.sleep(5)
        
    except Exception as e:
        print(f"An error occurred: {e}")
        # Take a screenshot on failure
        driver.save_screenshot("selenium_test_failure.png")
        print("Screenshot saved as selenium_test_failure.png")
    finally:
        # Close the browser
        print("Closing browser...")
        driver.quit()

if __name__ == "__main__":
    run_test()
