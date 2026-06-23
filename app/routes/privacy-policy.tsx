import { Link } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

export function meta() {
  return [
    { title: "Privacy Policy — PetStore Kenya" },
    { name: "description", content: "Review the official Privacy Policy of PetStore Kenya (petstore.co.ke) website." },
  ];
}

export default function PrivacyPolicy() {
  const sections = [
    {
      title: "What personal information do we collect from the people that visit our blog, website or app?",
      content: "When ordering or registering on our site, as appropriate, you may be asked to enter your name, email address, mailing address, phone number, credit card information or other details to help you with your experience. You must only submit to us, accurate and complete and not misleading information, We reserve the right to request for documentation to verify the information provided by you."
    },
    {
      title: "When do we collect information?",
      content: "We collect information from you when you place an order or enter information on our site. When you are online, we collect information regarding the pages within our network, which you visit and what you click on. As a general rule, we do not collect sensitive information. However, if we do, it will usually be for the purpose of providing our goods and services and if the law requires us to, we will seek your consent to collect it."
    },
    {
      title: "How do we use your information?",
      content: "We may use the information we collect from you when you register, make a purchase, sign up for our newsletter, respond to a survey or marketing communication, surf the website, or use certain other site features in the following ways:\n\n• To personalize your experience and to allow us to deliver the type of content and product offerings in which you are most interested.\n• To improve our website in order to better serve you.\n• To allow us to better service you in responding to your customer service requests.\n• To administer a contest, promotion, survey or other site feature.\n• To quickly process your transactions.\n• To ask for ratings and reviews of services or products.\n• To follow up with them after correspondence (live chat, email or phone inquiries)."
    },
    {
      title: "How do we protect your information?",
      content: "We do not use vulnerability scanning and/or scanning to PCI standards. An external PCI compliant payment gateway handles all CC transactions.\nWe use regular Malware Scanning.\nWe use an SSL certificate."
    },
    {
      title: "Do we use 'cookies'?",
      content: "We do use cookies for tracking purposes.\nYou can choose to have your computer warn you each time a cookie is being sent, or you can choose to turn off all cookies. You do this through your browser settings. Since browser is a little different, look at your browser's Help Menu to learn the correct way to modify your cookies.\nIf you turn cookies off, some of the features that make your site experience more efficient may not function properly."
    },
    {
      title: "Third-party disclosure",
      content: "We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information unless we provide users with advance notice. This does not include website hosting partners and other parties who assist us in operating our website, conducting our business, or serving our users, so long as those parties agree to keep this information confidential. We may also release information when its release is appropriate to comply with the law, enforce our site policies, or protect ours or others' rights, property or safety.\n\nHowever, non-personally identifiable visitor information may be provided to other parties for marketing, advertising, or other uses."
    },
    {
      title: "Third-party links",
      content: "Occasionally, at our discretion, we may include or offer third-party products or services (e.g. payment platforms) on our website. These third-party sites have separate and independent privacy policies. We, therefore, have no responsibility or liability for the content and activities of these linked sites. Nonetheless, we seek to protect the integrity of our site and welcome any feedback about these sites."
    },
    {
      title: "California Online Privacy Protection Act",
      content: "CalOPPA is the first state law in the nation to require commercial websites and online services to post a privacy policy. The law's reach stretches well beyond California to require any person or company in the United States (and conceivably the world) that operates websites collecting Personally Identifiable Information from California consumers to post a conspicuous privacy policy on its website stating exactly the information being collected and those individuals or companies with whom it is being shared.\n\nAccording to CalOPPA, we agree to the following:\n• Users can visit our site anonymously.\n• Once this privacy policy is created, we will add a link to it on our home page or as a minimum, on the first significant page after entering our website.\n• Our Privacy Policy link includes the word 'Privacy' and can easily be found on the page specified above.\n• You will be notified of any Privacy Policy changes on our Privacy Policy Page.\n• You can change your personal information by emailing us or logging in to your account.\n• You can delete your personal account by emailing us at hello@petstore.co.ke."
    },
    {
      title: "How does our site handle Do Not Track signals?",
      content: "We honor Do Not Track signals and Do Not Track, plant cookies, or use advertising when a Do Not Track (DNT) browser mechanism is in place."
    },
    {
      title: "Does our site allow third-party behavioral tracking?",
      content: "It's also important to note that we do not allow third-party behavioral tracking."
    },
    {
      title: "COPPA (Children Online Privacy Protection Act)",
      content: "When it comes to the collection of personal information from children under the age of 13 years old, the Children's Online Privacy Protection Act (COPPA) puts parents in control. The Federal Trade Commission, United States' consumer protection agency, enforces the COPPA Rule, which spells out what operators of websites and online services must do to protect children's privacy and safety online.\n\nWe do not specifically market to children under the age of 13 years old."
    },
    {
      title: "Fair Information Practices",
      content: "The Fair Information Practices Principles form the backbone of privacy law in the United States and the concepts they include have played a significant role in the development of data protection laws around the globe. Understanding the Fair Information Practice Principles and how they should be implemented is critical to comply with the various privacy laws that protect personal information.\n\nIn order to be in line with Fair Information Practices we will take the following responsive action, should a data breach occur:\n• We will notify you via email within 7 business days.\n• We also agree to the Individual Redress Principle which requires that individuals have the right to legally pursue enforceable rights against data collectors and processors who fail to adhere to the law. This principle requires not only that individuals have enforceable rights against data users, but also that individuals have recourse to courts or government agencies to investigate and/or prosecute non-compliance by data processors."
    },
    {
      title: "CAN SPAM Act",
      content: "The CAN-SPAM Act is a law that sets the rules for commercial email, establishes requirements for commercial messages, gives recipients the right to have emails stopped from being sent to them, and spells out tough penalties for violations.\n\nWe collect your email address in order to:\n• Send information, respond to inquiries, and/or other requests or questions.\n• Process orders and to send information and updates pertaining to orders.\n• Send you additional information related to your product and/or service.\n• Market to our mailing list or continue to send emails to our clients after the original transaction has occurred.\n\nTo be in accordance with CANSPAM, we agree to the following:\n• Not use false or misleading subjects or email addresses.\n• Identify the message as an advertisement in some reasonable way.\n• Include the physical address of our business or site headquarters.\n• Monitor third-party email marketing services for compliance, if one is used.\n• Honor opt-out/unsubscribe requests quickly.\n• Allow users to unsubscribe by using the link at the bottom of each email.\n\nIf at any time you would like to unsubscribe from receiving future emails, you can follow the instructions at the bottom of each email and we will promptly remove you from ALL correspondence."
    },
    {
      title: "Contacting Us",
      content: "If there are any questions regarding this privacy policy, you may contact us using the information below.\n\nLoki Ventures Ltd.\nP.O. Box 48960-00100\nNairobi, Kenya\nhello@petstore.co.ke\n\nLast Edited on 2020-02-17"
    }
  ];

  return (
    <>
      <Navbar />
      <div 
        className="page-container" 
        style={{ 
          maxWidth: "1200px", 
          margin: "0 auto", 
          padding: "3rem var(--page-pad) 5rem",
          fontFamily: "var(--font-sans)",
          backgroundColor: "#ffffff"
        }}
      >
        
        {/* Title Banner */}
        <PageHeader title="Privacy Policy" />

        {/* Content Section */}
        <div 
          style={{ 
            maxWidth: "960px", 
            margin: "0 auto", 
            padding: "1rem",
            color: "#333333",
            lineHeight: "1.8",
            fontSize: "1.05rem"
          }}
        >
          <h2 
            style={{ 
              fontSize: "1.45rem", 
              fontWeight: 700, 
              color: "#1E5DA7", 
              marginBottom: "2rem",
              paddingBottom: "0.5rem"
            }}
          >
            PetStore Kenya (petstore.co.ke) Privacy Policy
          </h2>

          <p style={{ color: "#4A5568", marginBottom: "2rem" }}>
            This privacy policy has been compiled to better serve those who are concerned with how their 'Personally Identifiable Information' (PII) is being used online. PII, as described in US privacy law and information security, is information that can be used on its own or with other information to identify, contact, or locate a single person, or to identify an individual in context. Please read our privacy policy carefully to get a clear understanding of how we collect, use, protect or otherwise handle your Personally Identifiable Information in accordance with our website.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {sections.map((s, idx) => (
              <div key={idx}>
                <h3 
                  style={{ 
                    fontSize: "1.15rem", 
                    fontWeight: 700, 
                    color: "#1E5DA7", 
                    marginBottom: "0.6rem" 
                  }}
                >
                  {s.title}
                </h3>
                <div style={{ margin: 0, color: "#4A5568", whiteSpace: "pre-line" }}>
                  {s.content}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
      <Footer />
    </>
  );
}
