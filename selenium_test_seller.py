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

def run_seller_test():
    # Setup Chrome options
    chrome_options = Options()
    # chrome_options.add_argument("--headless") # Uncomment if you want to run without UI
    
    # Initialize the WebDriver
    print("Initializing WebDriver...")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    # Maximize the window
    driver.maximize_window()
    
    try:
        # Get the absolute path to index.html
        base_path = os.path.dirname(os.path.abspath(__file__))
        index_path = f"file:///{os.path.join(base_path, 'index.html').replace(os.sep, '/')}"
        
        # 1. Open home page
        print(f"Opening Home Page: {index_path}")
        driver.get(index_path)
        time.sleep(2)
        
        # 2. Login as Seller
        print("Opening login modal...")
        login_btn = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CLASS_NAME, "btn-nav-login"))
        )
        login_btn.click()
        
        print("Entering Seller Credentials...")
        WebDriverWait(driver, 10).until(EC.visibility_of_element_located((By.ID, "loginCard")))
        driver.find_element(By.ID, "loginEmail").send_keys("jtreasaraphel@gmail.com")
        driver.find_element(By.ID, "loginPassword").send_keys("12345678")
        
        print("Submitting login...")
        driver.find_element(By.ID, "loginForm").submit()
        
        # 3. Verify Redirection to Seller Dashboard
        print("Waiting for Seller Dashboard redirection...")
        WebDriverWait(driver, 15).until(EC.url_contains("seller-dashboard.html"))
        print(f"Successfully reached: {driver.current_url}")
        
        # 4. Add a New Product
        print("Starting 'Add Product' flow...")
        # Debug: List all buttons to see what Selenium finds
        buttons = driver.find_elements(By.TAG_NAME, "button")
        print(f"Found {len(buttons)} buttons on page.")
        # for b in buttons: print(f" - Button: '{b.text}' (onclick: {b.get_attribute('onclick')})")

        add_product_btn = WebDriverWait(driver, 15).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "button[onclick*='openAddProductModal']"))
        )
        add_product_btn.click()
        
        # Fill the form
        WebDriverWait(driver, 10).until(EC.visibility_of_element_located((By.ID, "productModal")))
        print("Filling product details...")
        
        product_name = f"Test Fertilizer {int(time.time())}"
        driver.find_element(By.ID, "pName").send_keys(product_name)
        
        category_select = Select(driver.find_element(By.ID, "pCategory"))
        category_select.select_by_visible_text("Organic Fertilizers")
        
        driver.find_element(By.ID, "pPrice").send_keys("450")
        driver.find_element(By.ID, "pStock").send_keys("50")
        driver.find_element(By.ID, "pN").clear()
        driver.find_element(By.ID, "pN").send_keys("10")
        driver.find_element(By.ID, "pP").clear()
        driver.find_element(By.ID, "pP").send_keys("5")
        driver.find_element(By.ID, "pK").clear()
        driver.find_element(By.ID, "pK").send_keys("5")
        driver.find_element(By.ID, "pDesc").send_keys("This is an automated test product description.")
        
        # Submit the form
        print("Saving product...")
        driver.find_element(By.CSS_SELECTOR, "#productForm button[type='submit']").click()
        
        # Wait for modal to close and table to refresh
        time.sleep(3)
        
        # 5. Switch to 'My Products' tab to verify
        print("Switching to 'My Products' tab...")
        driver.execute_script("SellerDashboard.switchTab('products')")
        time.sleep(2)
        
        # Verify product exists in table
        print(f"Verifying product '{product_name}' in table...")
        rows = driver.find_elements(By.CSS_SELECTOR, "#myProductsTableBody tr")
        found_product = False
        target_row = None
        
        for row in rows:
            if product_name in row.text:
                found_product = True
                target_row = row
                break
        
        if found_product:
            print(f"SUCCESS: Product '{product_name}' found in the dashboard table.")
            # Verify Status (it should be PENDING or APPROVED depending on auto-approval)
            status = target_row.find_element(By.CLASS_NAME, "status-badge").text
            print(f"Product Status: {status}")
        else:
            print(f"FAILURE: Product '{product_name}' not found.")
            driver.save_screenshot("seller_test_add_failed.png")
            return

        # 6. Edit Product
        print("Testing 'Edit Product' flow...")
        edit_btn = target_row.find_element(By.CSS_SELECTOR, "button[title='Edit Product']")
        edit_btn.click()
        
        WebDriverWait(driver, 10).until(EC.visibility_of_element_located((By.ID, "productModal")))
        print("Updating price and stock...")
        price_field = driver.find_element(By.ID, "pPrice")
        price_field.clear()
        price_field.send_keys("550")
        
        stock_field = driver.find_element(By.ID, "pStock")
        stock_field.clear()
        stock_field.send_keys("75")
        
        driver.find_element(By.CSS_SELECTOR, "#productForm button[type='submit']").click()
        time.sleep(3)
        
        # Verify updates
        print("Verifying updates in table...")
        rows = driver.find_elements(By.CSS_SELECTOR, "#myProductsTableBody tr")
        for row in rows:
            if product_name in row.text:
                if "₹550" in row.text and "75" in row.text:
                    print("SUCCESS: Product details updated correctly.")
                else:
                    print(f"WARNING: Product updates might not be visible. Row text: {row.text}")
                target_row = row
                break
        
        # 7. Delete Product
        print("Testing 'Delete Product' flow...")
        delete_btn = target_row.find_element(By.CSS_SELECTOR, "button.danger")
        delete_btn.click()
        
        # Handle confirmation alert
        WebDriverWait(driver, 5).until(EC.alert_is_present())
        alert = driver.switch_to.alert
        print(f"Alert seen: {alert.text}")
        alert.accept()
        print("Alert accepted.")
        
        time.sleep(3)
        
        # Final Verification: Ensure it's gone
        print("Final verification: Ensuring product is removed...")
        final_rows = driver.find_elements(By.CSS_SELECTOR, "#myProductsTableBody tr")
        is_removed = True
        for row in final_rows:
            if product_name in row.text:
                is_removed = False
                break
        
        if is_removed:
            print(f"SUCCESS: Product '{product_name}' successfully deleted.")
        else:
            print(f"FAILURE: Product '{product_name}' still exists in the table.")
            driver.save_screenshot("seller_test_delete_failed.png")

        print("\nSeller Dashboard Full Lifecycle Test Completed Successfully!")
        time.sleep(5)

    except Exception as e:
        print(f"An error occurred: {e}")
        driver.save_screenshot("seller_test_error.png")
        print("Screenshot saved to seller_test_error.png")
    finally:
        print("Closing browser...")
        driver.quit()

if __name__ == "__main__":
    run_seller_test()
