import SEO from '../components/SEO';
import { useRouter } from 'next/router';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  const router = useRouter();
  const { isDark } = useTheme();

  return (
    <>
      <SEO
        title="Terms of Service"
        description="Read the Terms of Service for using AI Platform."
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
              Terms of Service
            </h1>
            <p className={`text-sm mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Last updated: October 15, 2025
            </p>

            <div className="max-w-none">
              <style jsx>{`
                .terms-content {
                  color: ${isDark ? '#e5e7eb' : '#374151'};
                  line-height: 1.7;
                }
                .terms-content h2 {
                  color: ${isDark ? '#f9fafb' : '#111827'};
                  font-size: 1.5rem;
                  font-weight: 700;
                  margin-top: 2rem;
                  margin-bottom: 1rem;
                }
                .terms-content h3 {
                  color: ${isDark ? '#f3f4f6' : '#1f2937'};
                  font-size: 1.25rem;
                  font-weight: 600;
                  margin-top: 1.5rem;
                  margin-bottom: 0.75rem;
                }
                .terms-content p {
                  color: ${isDark ? '#d1d5db' : '#4b5563'};
                  margin-bottom: 1rem;
                }
                .terms-content ul {
                  margin-bottom: 1rem;
                }
                .terms-content li {
                  color: ${isDark ? '#d1d5db' : '#4b5563'};
                  margin-bottom: 0.5rem;
                }
                .terms-content strong {
                  color: ${isDark ? '#f3f4f6' : '#1f2937'};
                  font-weight: 600;
                }
              `}</style>
              <div className="terms-content">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing and using AI Platform ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use the Service.
              </p>

              <h2>2. Description of Service</h2>
              <p>
                AI Platform provides AI-powered services including:
              </p>
              <ul>
                <li>AI chat conversations powered by GPT-4 and other language models</li>
                <li>AI image generation using DALL-E and other image models</li>
                <li>Custom AI persona creation and management</li>
                <li>Template library for prompts</li>
                <li>Content sharing capabilities</li>
              </ul>

              <h2>3. User Accounts</h2>
              <h3>3.1 Registration</h3>
              <p>
                To access certain features, you must create an account. You agree to:
              </p>
              <ul>
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your password</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>

              <h3>3.2 Account Termination</h3>
              <p>
                We reserve the right to suspend or terminate your account if you violate these terms or engage in fraudulent, abusive, or illegal activities.
              </p>

              <h2>4. Credits and Payment</h2>
              <h3>4.1 Free Credits</h3>
              <p>
                New users receive 50 free credits upon signup. Credits are used for AI interactions (1 credit per chat, 5 credits per image).
              </p>

              <h3>4.2 Purchasing Credits</h3>
              <ul>
                <li>Credits can be purchased through our payment processor (Razorpay)</li>
                <li>All prices are displayed in Indian Rupees (INR)</li>
                <li>Payments are processed securely and are non-refundable except as required by law</li>
                <li>Credits do not expire but are non-transferable</li>
              </ul>

              <h3>4.3 Refunds</h3>
              <p>
                Refunds are generally not provided for purchased credits. However, we may issue refunds at our sole discretion for technical issues or service disruptions.
              </p>

              <h2>5. Acceptable Use</h2>
              <h3>5.1 Permitted Use</h3>
              <p>You may use the Service for lawful purposes only.</p>

              <h3>5.2 Prohibited Activities</h3>
              <p>You agree NOT to:</p>
              <ul>
                <li>Use the Service to generate illegal, harmful, or offensive content</li>
                <li>Attempt to reverse engineer or hack the Service</li>
                <li>Share your account credentials with others</li>
                <li>Use automated tools to abuse the Service (bots, scrapers)</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Generate content that infringes on intellectual property rights</li>
                <li>Use the Service to spam or harass others</li>
                <li>Attempt to exploit bugs or vulnerabilities</li>
              </ul>

              <h2>6. Content Ownership and Rights</h2>
              <h3>6.1 Your Content</h3>
              <p>
                You retain ownership of content you create using the Service (prompts, custom AI configurations). By using the Service, you grant us a license to process your content to provide the Service.
              </p>

              <h3>6.2 AI-Generated Content</h3>
              <p>
                AI-generated content (chat responses, images) is subject to the terms of our AI providers (OpenAI). You may use AI-generated content in accordance with those terms.
              </p>

              <h3>6.3 Shared Content</h3>
              <p>
                When you share content publicly, you grant us and viewers a license to display that content.
              </p>

              <h2>7. Intellectual Property</h2>
              <p>
                The Service, including its design, code, features, and branding, is owned by AI Platform and protected by copyright, trademark, and other laws. You may not copy, modify, or distribute our intellectual property without permission.
              </p>

              <h2>8. Disclaimers</h2>
              <h3>8.1 Service Availability</h3>
              <p>
                The Service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free access.
              </p>

              <h3>8.2 AI Limitations</h3>
              <p>
                AI-generated content may contain errors, inaccuracies, or inappropriate material. We are not responsible for the accuracy or quality of AI outputs.
              </p>

              <h3>8.3 Third-Party Services</h3>
              <p>
                We use third-party AI providers (OpenAI) and are subject to their service availability and terms.
              </p>

              <h2>9. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, AI Platform shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
              </p>

              <h2>10. Indemnification</h2>
              <p>
                You agree to indemnify and hold AI Platform harmless from any claims, damages, or expenses arising from your use of the Service or violation of these terms.
              </p>

              <h2>11. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of significant changes. Continued use of the Service constitutes acceptance of modified terms.
              </p>

              <h2>12. Privacy</h2>
              <p>
                Your use of the Service is also governed by our Privacy Policy. Please review it to understand how we collect and use your information.
              </p>

              <h2>13. Termination</h2>
              <p>
                You may terminate your account at any time. We may terminate or suspend access immediately, without prior notice, for conduct that violates these terms or is harmful to other users, us, or third parties.
              </p>

              <h2>14. Governing Law</h2>
              <p>
                These terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
              </p>

              <h2>15. Dispute Resolution</h2>
              <p>
                Any disputes arising from these terms or use of the Service shall be resolved through arbitration in accordance with [Arbitration Rules] before resorting to litigation.
              </p>

              <h2>16. Contact Information</h2>
              <p>
                For questions about these Terms of Service, contact us at:
              </p>
              <p>
                <strong>Email:</strong> support@ai-platform.com<br />
                <strong>Address:</strong> [Your Company Address]
              </p>

              <h2>17. Severability</h2>
              <p>
                If any provision of these terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
              </p>

              <h2>18. Entire Agreement</h2>
              <p>
                These terms constitute the entire agreement between you and AI Platform regarding the use of the Service.
              </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

