import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

class NutriRootTest:
    def __init__(self):
        chrome_options = Options()
        # chrome_options.add_argument("--headless")
        self.service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=self.service, options=chrome_options)
        self.wait = WebDriverWait(self.driver, 10)
        
        # Get absolute path to the project
        base_path = os.path.dirname(os.path.abspath(__file__))
        self.base_url = f"file:///{base_path.replace(os.sep, '/')}"

    def run_suite(self):
        try:
            print("--- Starting NutriRoot Automation Suite ---")
            
            # 1. Test Landing Page Load
            self.test_page_load()
            
            # 2. Test Login Modal Interaction
            self.test_login_modal()
            
            # 3. Test Seller Registration Flow (Multi-step)
            self.test_seller_registration()
            
            # 4. Test Shop Navigation & Search
            self.test_shop_and_search()
            
            # 5. Test Add to Cart
            self.test_cart_functionality()

            print("\n--- All Tests Completed Successfully! ---")
            time.sleep(2)
            
        except Exception as e:
            print(f"\n[!] Test Suite Failed: {e}")
            # Take screenshot on failure
            self.driver.save_screenshot("test_failure.png")
            print("Screenshot saved to test_failure.png")
        finally:
            print("Closing browser...")
            self.driver.quit()

    def test_page_load(self):
        print("\n[Test 1] Checking Page Load...")
        url = f"{self.base_url}/index.html"
        self.driver.get(url)
        self.wait.until(EC.title_contains("NutriRoot"))
        print(f"Loaded: {self.driver.title}")

    def test_login_modal(self):
        print("\n[Test 2] Testing Login Modal...")
        # Open Modal
        login_btn = self.wait.until(EC.element_to_be_clickable((By.CLASS_NAME, "btn-nav-login")))
        login_btn.click()
        
        # Wait for modal to be visible
        self.wait.until(EC.visibility_of_element_located((By.ID, "loginCard")))
        print("Login modal opened.")
        
        # Fill Login (Sample data)
        email_input = self.driver.find_element(By.ID, "loginEmail")
        pass_input = self.driver.find_element(By.ID, "loginPassword")
        
        email_input.send_keys("test@example.com")
        pass_input.send_keys("password123")
        print("Login form fields filled.")
        
        # Close Modal
        close_btn = self.driver.find_element(By.CSS_SELECTOR, "#loginCard .close-btn")
        close_btn.click()
        print("Login modal closed.")
        time.sleep(1)

    def test_seller_registration(self):
        print("\n[Test 3] Testing Seller Registration Flow...")
        self.driver.get(f"{self.base_url}/seller-register.html")
        
        # Step 1
        print("Step 1: Account Info")
        self.driver.find_element(By.ID, "email").send_keys("seller_test@nutriroot.com")
        self.driver.find_element(By.ID, "phoneNumber").send_keys("9876543210")
        self.driver.find_element(By.ID, "password").send_keys("SellerPass123")
        self.driver.find_element(By.ID, "confirmPassword").send_keys("SellerPass123")
        
        # Click Proceed
        self.driver.find_element(By.CSS_SELECTOR, "#step1 .btn-proceed").click()
        time.sleep(1)
        
        # Step 2
        print("Step 2: Business Info")
        self.wait.until(EC.visibility_of_element_located((By.ID, "firstName")))
        self.driver.find_element(By.ID, "firstName").send_keys("Test")
        self.driver.find_element(By.ID, "lastName").send_keys("Vendor")
        self.driver.find_element(By.CSS_SELECTOR, "#step2 .btn-proceed").click()
        time.sleep(1)
        
        # Step 3
        print("Step 3: Shop Details")
        self.wait.until(EC.visibility_of_element_located((By.ID, "shopName")))
        self.driver.find_element(By.ID, "shopName").send_keys("Selenium Test Shop")
        self.driver.find_element(By.ID, "shopAddress").send_keys("123 Automation Lane, Tech City")
        self.driver.find_element(By.CSS_SELECTOR, "#step3 .btn-proceed").click()
        time.sleep(1)
        
        # Step 4
        print("Step 4: TIN & Terms")
        self.wait.until(EC.visibility_of_element_located((By.ID, "tin")))
        self.driver.find_element(By.ID, "tin").send_keys("123456789")
        # Set a future date for TIN expiry
        self.driver.find_element(By.ID, "tinExpireDate").send_keys("25122026") # DDMMYYYY
        
        # Agree to terms (using javascript click as checkbox can be tricky)
        checkbox = self.driver.find_element(By.ID, "agreeTerms")
        self.driver.execute_script("arguments[0].click();", checkbox)
        
        print("Seller registration form filled successfully.")
        time.sleep(1)

    def test_shop_and_search(self):
        print("\n[Test 4] Testing Shop & Search...")
        self.driver.get(f"{self.base_url}/shop.html")
        
        # Search for a product
        search_input = self.wait.until(EC.visibility_of_element_located((By.ID, "shopSearch")))
        search_input.send_keys("Neem")
        print("Searching for 'Neem'...")
        time.sleep(2)
        
        # Check if products are filtered
        products = self.driver.find_elements(By.CLASS_NAME, "product-card")
        print(f"Found {len(products)} products after search.")

    def test_cart_functionality(self):
        print("\n[Test 5] Testing Cart Functionality...")
        # Assuming we are on the shop page from the previous test
        
        # Find first 'Add to Cart' button
        try:
            add_to_cart_btns = self.driver.find_elements(By.CLASS_NAME, "btn-cart")
            if add_to_cart_btns:
                add_to_cart_btns[0].click()
                print("Clicked 'Add to Cart' on first product.")
                time.sleep(1)
                
                # Open Cart
                cart_toggle = self.driver.find_element(By.CLASS_NAME, "cart-toggle")
                cart_toggle.click()
                print("Cart opened.")
                
                # Check if item is in cart
                self.wait.until(EC.visibility_of_element_located((By.ID, "cartModal")))
                cart_items = self.driver.find_elements(By.CLASS_NAME, "cart-item")
                if len(cart_items) > 0:
                    print(f"Product successfully added to cart. (Items: {len(cart_items)})")
                else:
                    print("Error: Cart is empty after adding item.")
            else:
                print("No products found to add to cart.")
        except Exception as e:
            print(f"Cart test sub-step failed: {e}")

if __name__ == "__main__":
    suite = NutriRootTest()
    suite.run_suite()
