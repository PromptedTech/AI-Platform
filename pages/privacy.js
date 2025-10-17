import SEO from '../components/SEO';
import { useRouter } from 'next/router';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  const router = useRouter();
  const { isDark } = useTheme();

  return (
    <>
      <SEO
        title="Privacy Policy"
        description="Learn how AI Platform collects, uses, and protects your personal information."
      />
      
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} py-12`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className={`flex items-center gap-2 mb-8 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>

          {/* Content */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 sm:p-12`}>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Privacy Policy
            </h1>
            <p className={`text-sm mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Last updated: October 15, 2025
            </p>

            <div className="max-w-none">
              <style jsx>{`
                .privacy-content {
                  color: ${isDark ? '#e5e7eb' : '#374151'};
                  line-height: 1.7;
                }
                .privacy-content h2 {
                  color: ${isDark ? '#f9fafb' : '#111827'};
                  font-size: 1.5rem;
                  font-weight: 700;
                  margin-top: 2rem;
                  margin-bottom: 1rem;
                }
                .privacy-content h3 {
                  color: ${isDark ? '#f3f4f6' : '#1f2937'};
                  font-size: 1.25rem;
                  font-weight: 600;
                  margin-top: 1.5rem;
                  margin-bottom: 0.75rem;
                }
                .privacy-content p {
                  color: ${isDark ? '#d1d5db' : '#4b5563'};
                  margin-bottom: 1rem;
                }
                .privacy-content ul {
                  margin-bottom: 1rem;
                }
                .privacy-content li {
                  color: ${isDark ? '#d1d5db' : '#4b5563'};
                  margin-bottom: 0.5rem;
                }
                .privacy-content strong {
                  color: ${isDark ? '#f3f4f6' : '#1f2937'};
                  font-weight: 600;
                }
              `}</style>
              <div className="privacy-content">
              <h2>1. Introduction</h2>
              <p>
                Welcome to AI Platform ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights.
              </p>

              <h2>2. Information We Collect</h2>
              <h3>2.1 Information You Provide</h3>
              <ul>
                <li><strong>Account Information:</strong> Email address, display name, and profile picture</li>
                <li><strong>User Content:</strong> Chat messages, image prompts, and custom AI personas you create</li>
                <li><strong>Payment Information:</strong> Payment details processed securely through Razorpay (we don't store card details)</li>
                <li><strong>Feedback:</strong> Bug reports and feedback you submit</li>
              </ul>

              <h3>2.2 Automatically Collected Information</h3>
              <ul>
                <li><strong>Usage Data:</strong> How you interact with our service (chats, images generated, credits used)</li>
                <li><strong>Device Information:</strong> Browser type, IP address, device type</li>
                <li><strong>Cookies:</strong> We use cookies to maintain your session and preferences</li>
              </ul>

              <h2>3. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul>
                <li>Provide and maintain our AI services</li>
                <li>Process payments and manage your credits</li>
                <li>Improve our AI models and services</li>
                <li>Send service-related notifications</li>
                <li>Respond to your support requests</li>
                <li>Detect and prevent fraud or abuse</li>
              </ul>

              <h2>4. Data Sharing</h2>
              <p>We share your data only in the following circumstances:</p>
              <ul>
                <li><strong>AI Service Providers:</strong> We use OpenAI's API to provide AI chat and image generation</li>
                <li><strong>Payment Processors:</strong> Razorpay processes payments securely</li>
                <li><strong>Analytics:</strong> Firebase Analytics helps us understand usage patterns</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>
              <p><strong>We never sell your personal data to third parties.</strong></p>

              <h2>5. Data Retention</h2>
              <p>
                We retain your personal data for as long as your account is active or as needed to provide services. You can request deletion of your account and data at any time.
              </p>

              <h2>6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent at any time</li>
              </ul>

              <h2>7. Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your data, including encryption, secure authentication (Firebase Auth), and regular security audits.
              </p>

              <h2>8. Children's Privacy</h2>
              <p>
                Our service is not intended for users under 13 years old. We do not knowingly collect data from children under 13.
              </p>

              <h2>9. International Data Transfers</h2>
              <p>
                Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place.
              </p>

              <h2>10. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
              </p>

              <h2>11. Contact Us</h2>
              <p>
                If you have questions about this privacy policy or want to exercise your rights, contact us at:
              </p>
              <p>
                <strong>Email:</strong> support@ai-platform.com<br />
                <strong>Address:</strong> [Your Company Address]
              </p>

              <h2>12. GDPR Compliance</h2>
              <p>
                For users in the European Union, we comply with GDPR requirements. You have additional rights under GDPR, including the right to lodge a complaint with a supervisory authority.
              </p>

              <h2>13. California Privacy Rights (CCPA)</h2>
              <p>
                California residents have specific rights under the CCPA, including the right to know what personal information is collected and the right to request deletion.
              </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

