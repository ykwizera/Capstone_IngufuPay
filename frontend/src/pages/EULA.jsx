import { useNavigate } from "react-router-dom"
import { ArrowLeft, FileText } from "lucide-react"
import "./EULA.css"

export default function EULA() {
  const navigate = useNavigate()

  return (
    <div className="eula-page">
      <div className="eula-container">

        {/* Header */}
        <div className="eula-header">
          <button className="eula-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className="eula-title-block">
            <div className="eula-icon"><FileText size={22} /></div>
            <div>
              <div className="eula-title">End-User License Agreement</div>
              <div className="eula-sub">IngufuPay · Version 1.0 · Effective March 2026</div>
            </div>
          </div>
        </div>

        <div className="eula-body">

          <div className="eula-notice">
            Please read this agreement carefully before using IngufuPay. By creating an account or
            using the application, you agree to be bound by these terms.
          </div>

          <div className="eula-section">
            <div className="eula-section-title">1. Definitions</div>
            <p>"Application" means the IngufuPay software platform, including the web app, USSD service, and all associated APIs.</p>
            <p>"User" means any individual who registers for, accesses, or uses the Application.</p>
            <p>"Token" means a prepaid electricity unit purchased through the Application.</p>
            <p>"Meter" means a registered prepaid electricity meter linked to a User Account.</p>
            <p>"Developer" means the creator and operator of IngufuPay, a capstone project at the African Leadership University, Rwanda.</p>
          </div>

          <div className="eula-section">
            <div className="eula-section-title">2. License Grant</div>
            <p>Subject to your compliance with this Agreement, the Developer grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Application solely for your personal electricity management purposes.</p>
            <p>This license does not permit you to:</p>
            <ul>
              <li>Copy, modify, distribute, sell, or lease any part of the Application.</li>
              <li>Reverse engineer or attempt to extract the source code of the Application.</li>
              <li>Use the Application for any unlawful purpose.</li>
              <li>Share your Account credentials with any third party.</li>
            </ul>
          </div>

          <div className="eula-section">
            <div className="eula-section-title">3. User Accounts and Registration</div>
            <p>To access the full features of the Application, you must create an Account. By doing so, you agree to:</p>
            <ul>
              <li>Provide accurate and complete information including your name, email, national ID, and phone number.</li>
              <li>Maintain the security of your password and USSD PIN.</li>
              <li>Accept responsibility for all activities that occur under your Account.</li>
              <li>Notify us immediately of any unauthorized use of your Account.</li>
            </ul>
          </div>

          <div className="eula-section">
            <div className="eula-section-title">4. Meter Registration and Approval</div>
            <p>Meters may not be self-registered. All meter registrations require:</p>
            <ul>
              <li>Submitting a formal meter request with accurate location and national ID details.</li>
              <li>Admin review and approval before a meter is activated on your account.</li>
              <li>A unique meter number is automatically assigned upon approval based on your location.</li>
              <li>Submitting false information may result in account suspension.</li>
            </ul>
          </div>

          <div className="eula-section">
            <div className="eula-section-title">5. Transactions and Payments</div>
            <p>All purchases of electricity tokens are final and non-refundable once the token has been generated and delivered to the meter. The price per kWh is set by the Administrator and may change at any time. You will see the current price before completing any purchase.</p>
            <p>Supported payment methods include Mobile Money (MTN MoMo, Airtel Money) and airtime deduction via USSD.</p>
          </div>

          <div className="eula-section">
            <div className="eula-section-title">6. IoT Device and Smart Meter Integration</div>
            <p>If your meter is equipped with an ESP32 IoT device:</p>
            <ul>
              <li>You must not share or expose the device token to any unauthorized person.</li>
              <li>The Developer is not responsible for damage or incorrect readings caused by hardware failures or tampering.</li>
              <li>Power control is managed automatically based on your unit balance. The Developer is not liable for unintended power interruptions due to depleted balances.</li>
            </ul>
          </div>

          <div className="eula-section">
            <div className="eula-section-title">7. Privacy and Data Collection</div>
            <p>By using the Application, you consent to the collection and processing of your personal information (name, email, phone, national ID, address), meter data (meter number, balance, transaction history), and usage data (login activity, session information).</p>
            <p>This data is used solely for operating the Application. We do not sell your data to third parties. Data may be shared with service providers like Africa's Talking for USSD and SMS services.</p>
          </div>

          <div className="eula-section">
            <div className="eula-section-title">8. Acceptable Use Policy</div>
            <p>You agree not to:</p>
            <ul>
              <li>Submit fraudulent meter requests or impersonate another person.</li>
              <li>Attempt to manipulate meter balances, transaction records, or system settings.</li>
              <li>Interfere with or disrupt the Application's servers or security.</li>
              <li>Use automated tools or bots to interact with the Application without prior consent.</li>
            </ul>
          </div>

          <div className="eula-section">
            <div className="eula-section-title">9. Disclaimer of Warranties</div>
            <p>THE APPLICATION IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. THE DEVELOPER DOES NOT WARRANT THAT THE APPLICATION WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE AT ALL TIMES. YOUR USE OF THE APPLICATION IS AT YOUR SOLE RISK.</p>
          </div>

          <div className="eula-section">
            <div className="eula-section-title">10. Limitation of Liability</div>
            <p>The Developer shall not be liable for any indirect, incidental, or consequential damages including loss of electricity supply, financial losses from failed transactions, or data loss. Total liability shall not exceed the amount paid in your most recent transaction.</p>
          </div>

          <div className="eula-section">
            <div className="eula-section-title">11. Termination</div>
            <p>The Developer may suspend or terminate your access at any time for violations of this Agreement, fraudulent conduct, or requests by law enforcement. You may terminate by deleting your Account. Transaction records may be retained as required by law.</p>
          </div>

          <div className="eula-section">
            <div className="eula-section-title">12. Governing Law</div>
            <p>This Agreement is governed by the laws of the Republic of Rwanda. Any disputes shall be subject to the exclusive jurisdiction of the courts of Rwanda.</p>
          </div>

          <div className="eula-section">
            <div className="eula-section-title">13. Changes to This Agreement</div>
            <p>The Developer may modify this Agreement at any time. Changes will be communicated via email and/or in-app notification. Continued use of the Application after any modification constitutes acceptance of the updated Agreement.</p>
          </div>

          <div className="eula-section">
            <div className="eula-section-title">14. Contact Information</div>
            <p>For questions about this Agreement, contact:</p>
            <div className="eula-contact">
              <div>IngufuPay Support — African Leadership University, Kigali, Rwanda</div>
              <div>Email: y.kwizera@alustudent.com</div>
              <div>Phone: +250 784 494 644</div>
            </div>
          </div>

          <div className="eula-footer-note">
            By using IngufuPay, you acknowledge that you have read, understood, and agree to be bound by this End-User License Agreement.
          </div>

        </div>
      </div>
    </div>
  )
}