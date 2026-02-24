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
        time.sleep(2)
        
        # Perform some basic checks
        print(f"Page Title: {driver.title}")
        
        # Example: Find the login button or some other element
        # You can use driver.find_element(By.ID, "id_name") etc.
        
        print("Success! Selenium is working in your project.")
        
        # Wait a bit before closing
        time.sleep(3)
        
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        # Close the browser
        print("Closing browser...")
        driver.quit()

if __name__ == "__main__":
    run_test()
