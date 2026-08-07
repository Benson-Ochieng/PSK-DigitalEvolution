import { Link, useLoaderData, useNavigate, data, redirect, Form, useActionData } from "react-router";
import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { query } from "../db.server";
import { getLoyaltyPoints } from "../lib/loyalty.server";
import { useCart } from "../context/cart";
import PageHeader from "../components/PageHeader";


export const SHIPPING_ZONES: Record<string, Record<string, number>> = {
  "Select a City": {
    "Select your Neighbourhood": 0
  },
  "Nairobi": {
    "Select your Neighbourhood": 0,
    "A.S.K. Showgrounds/Wanye": 300,
    "Adams Arcade/ Dagoretti Corner": 300,
    "Bahati/ Marisha/ Viwandani/ Jeri": 300,
    "Buruburu/ Hanza/ Harambee": 300,
    "CBD - GPO / City Market/ Nation Center": 300,
    "CBD - Luthuli/ Afya Center/ R. Ngara": 300,
    "CBD - UoN/ Globe/ Koja": 300,
    "Dagoretti South - Ngando": 300,
    "Dagoretti South - Riruta": 300,
    "Donholm/ Greenfields/ Kayole/ Nasra": 300,
    "Embakasi - Fedha": 300,
    "Embakasi East - Embakasi/ Utawala": 300,
    "Embakasi North - Dandora/ Kariobangi": 300,
    "Embakasi South - Bunyala Rd/ South B": 300,
    "Embakasi South - Landimawe": 300,
    "Gigiri/ Runda": 300,
    "Githuria/ Kahawa Sukari": 300,
    "Huruma/ Kiamaiko/ Mabatini/ Ngei": 300,
    "Imara Daima/ Kwa Njega": 300,
    "Imara Daima/ AA/ Maziwa/ Kwa Njega": 300,
    "Kahawa Wendani/ Kenyatta University": 300,
    "Kahawa West/ Githurai 44": 300,
    "Kamukunji - Airbase": 300,
    "Kamukunji - Carlifonia/ Eastleigh": 300,
    "Kangemi - Loresho/ Kangemi": 300,
    "Karen": 300,
    "Kariobangi South/ Dandora/ Airbase": 300,
    "Kasarani - Clay City/ Kasarani/ Mwiki": 300,
    "Kibra - Jamhuri/ Woodley": 300,
    "Kibra - Makina/ Sarangombe": 300,
    "Kileleshwa/Kilimani": 300,
    "Komarock/ Kangundo Road/ Saika/ Obama": 300,
    "Kwa Rueben/ Kware/ Pipeline": 300,
    "Laini Saba/ Lindi/ Makina/ Sarangombe": 300,
    "Langata - Dam Estate/ Nyayo Highrise/ Ngumo": 350,
    "Langata - Mbangathi Way/ Ngumo": 350,
    "Langata - Nairobi West/ South C": 350,
    "Langata - Otiende/ Southlands/ St Mary's": 350,
    "Lavington/ Kawangware/ Gatina": 300,
    "Lavington/ Kawangware/ Gatina/ Waithaka": 300,
    "Lower Kabete/ Kangemi/ Mountain View": 300,
    "Madiwa/ Pumwani": 300,
    "Mihango/ Njiru/ Chokaa/ Ruai/ Kamulu": 300,
    "Mountain view/ Kangemi": 300,
    "Mutuini/ Rithimitu": 300,
    "Railways/ Muthurwa/ BS/ OTC": 300,
    "Roysambu/ Zimmerman": 300,
    "Ruaraka - Babadogo/ Lucky Summer": 300,
    "Ruaraka - Mathare North/ Survey/ Utalii": 300,
    "Saika/ Obama/ Komarocks": 300,
    "Spring valley/ Kyuna": 300,
    "Starehe - Kariokor/ Ziwani": 300,
    "Starehe - Ngara": 300,
    "Starehe - Pangani": 300,
    "Transami/ Airport North Road": 300,
    "Umoja/ Tena Estate/ Nasra": 300,
    "Upperhill - Community/ KNH": 300,
    "Upperhill - Elgon Road/ Lower Hill": 300,
    "Upperhill - Kiambere Road/ Mara Road": 300,
    "Upperhill - Kiambere Road/ Mara Road/ Elgon Road/ Lower Hill": 300,
    "Westlands - Central": 300,
    "Westlands - Parklands/ Highridge": 300,
    "CMS Africa": 0
  },
  "Machakos": {
    "Select your Neighbourhood": 0,
    "Syokimau/ Mlolongo/ Athi River": 500,
    "Machakos Town": 550,
    "Kangundo": 500,
    "Matuu": 500
  },
  "Kiambu": {
    "Select your Neighbourhood": 0,
    "Banana Hill/ Muchatha": 350,
    "Garden Estate/ Thome/ Maruri": 500,
    "Gatundu Town": 500,
    "Githunguri/ Ndumberi": 500,
    "Juja/ Wetaithe/ Ngoingwa": 500,
    "Kabete - Gitaru/ Muguga/ Nyadhunya/ Kabete/ Uthiru": 350,
    "Kabete - Uthiru": 350,
    "Kamiti/ Tatu City/ Nova": 500,
    "Kiambu Town/ Kiringiti": 500,
    "Kikuyu/ Gitaru/ Kanyariri/ Muguga": 350,
    "Kinoo/ Muthiga/ Nyadhuna": 350,
    "Limuru": 500,
    "Muthaiga North/ Muthaiga": 350,
    "Ndenderu/ Kiamba/ Gachie/ Karura": 350,
    "Ruaka/ Cianda": 350,
    "Ruiru Town/ Kimbo/ Toll/ Kenyatta Rd": 350,
    "Ruiru - Bypass/ Membley": 350,
    "Runda/ Fourways/ Edenville": 350,
    "Thika Town": 500,
    "Wangige": 350
  },
  "Mombasa": {
    "Select your Neighbourhood": 0,
    "Changamwe": 500,
    "Jomvu": 500,
    "Kisauni": 500,
    "Kizingo/ Mbaraki/ Mama Ngina Drive": 500,
    "Likoni": 500,
    "Mtwapa": 500,
    "Mvita": 500,
    "Nyali": 500
  },
  "Nyeri": {
    "Select your Neighbourhood": 0,
    "Iria-ini/ Konyu/ Magutu/ Ngorano": 500,
    "Nyeri Town": 500,
    "Karatina /Iria-ini/ Konyu/ Magutu/ Ngorano": 500,
    "Nyeri Town - Kiganjo/ Kirichu": 500,
    "Othaya": 500
  },
  "Baringo": {
    "Select your Neighbourhood": 0,
    "Eldana Ravine": 550,
    "Karbanet Town": 550
  },
  "Bomet": {
    "Select your Neighbourhood": 0,
    "Bomet Town": 550,
    "Sitok": 550
  },
  "Bungoma": {
    "Select your Neighbourhood": 0,
    "Bungoma Town": 550,
    "Kamilili": 550,
    "Webuye": 550
  },
  "Busia": {
    "Select your Neighbourhood": 0,
    "Busia Town": 550,
    "Malaba Town": 550
  },
  "Elgeyo Marakwet": {
    "Select your Neighbourhood": 0,
    "Iten": 550
  },
  "Embu": {
    "Select your Neighbourhood": 0,
    "Embu Town": 450,
    "Runyenjes": 450
  },
  "Garissa": {
    "Select your Neighbourhood": 0,
    "Garissa Township": 550
  },
  "Homa Bay": {
    "Select your Neighbourhood": 0,
    "Homa Bay Town": 550,
    "Mbita": 550,
    "Oyugis": 550
  },
  "Isiolo": {
    "Select your Neighbourhood": 0,
    "Isiolo Town": 550
  },
  "Kajiado": {
    "Select your Neighbourhood": 0,
    "Kajiado Town": 550,
    "Kiserian": 550,
    "Kitengela": 550,
    "Loitoktok": 550,
    "Ngong": 550,
    "Ongata Rongai": 550
  },
  "Kakamega": {
    "Select your Neighbourhood": 0,
    "Kakamega Town": 550,
    "Butere": 550,
    "Mumias": 550
  },
  "Kericho": {
    "Select your Neighbourhood": 0,
    "Kericho Town": 550,
    "Litein": 550
  },
  "Kilifi": {
    "Select your Neighbourhood": 0,
    "Kilifi": 550,
    "Malindi": 550,
    "Mariakani": 550,
    "Watamu": 550
  },
  "Kirinyaga": {
    "Select your Neighbourhood": 0,
    "Kerugoya Town": 550,
    "Mwea": 550
  },
  "Kisii": {
    "Select your Neighbourhood": 0,
    "Keroka": 550,
    "Kisii Town": 550,
    "Ogembo": 550
  },
  "Kisumu": {
    "Select your Neighbourhood": 0,
    "Ahero": 500,
    "Kaloleni/ Nyalenda B/ Railways": 500,
    "Kicomi/ Pipeline": 500,
    "Kisumu CBD": 500,
    "Kisumu National Airport/ Bandani/ Brightlight": 500,
    "Maseno": 500
  },
  "Kitui": {
    "Select your Neighbourhood": 0,
    "Kitui": 500,
    "Mwingi": 500
  },
  "Kwale": {
    "Select your Neighbourhood": 0,
    "Diani/ Ukunda": 500,
    "Kwale Town": 500
  },
  "Laikipia": {
    "Select your Neighbourhood": 0,
    "Nanyuki Town": 550,
    "Nyahururu": 550
  },
  "Lamu": {
    "Select your Neighbourhood": 0,
    "Lamu": 550,
    "Mpeketoni": 550
  },
  "Makueni": {
    "Select your Neighbourhood": 0,
    "Emali Town": 500,
    "Kibwezi": 500,
    "Mtito Andei": 500,
    "Wote": 500
  },
  "Marsabit": {
    "Select your Neighbourhood": 0,
    "Marsabit Town": 550
  },
  "Meru": {
    "Select your Neighbourhood": 0,
    "Maua": 500,
    "Meru Town": 500,
    "Nkubu": 500
  },
  "Migori": {
    "Select your Neighbourhood": 0,
    "Awendo": 500,
    "Kehancha": 500,
    "Migori Town": 500,
    "Rongo": 500
  },
  "Murang'a": {
    "Select your Neighbourhood": 0,
    "Kabati": 500,
    "Kenol": 500,
    "Murang'a Town": 500
  },
  "Nakuru": {
    "Select your Neighbourhood": 0,
    "Bahati": 500,
    "Gilgil": 500,
    "Industrial Area/ Langalanga/ Shabab": 500,
    "Keptembwa/ Kapkuresi/ Soilo/ Rvist": 500,
    "Kuresoi": 500,
    "Lanet/ Pipeline": 500,
    "Mai Mahiu": 500,
    "Milimani/ Pgh/ Ngata Bridge/ Baraka": 500,
    "Molo": 500,
    "Naivasha": 500,
    "Nakuru CBD": 500,
    "Nakuru West - Mercy Njeri/ London": 500,
    "Njoro": 500
  },
  "Nandi": {
    "Select your Neighbourhood": 0,
    "Nandi Hills": 500,
    "Kapsabet Town": 500
  },
  "Narok": {
    "Select your Neighbourhood": 0,
    "Kilgoris": 500,
    "Narok Town": 500
  },
  "Nyamira": {
    "Select your Neighbourhood": 0,
    "Nyamira Town": 500
  },
  "Nyandarua": {
    "Select your Neighbourhood": 0,
    "Ol Kalou": 500
  },
  "Samburu": {
    "Select your Neighbourhood": 0,
    "Maralal": 600
  },
  "Siaya": {
    "Select your Neighbourhood": 0,
    "Bondo": 600,
    "Siaya Town": 600,
    "Ugunja": 600
  },
  "Taita Taveta": {
    "Select your Neighbourhood": 0,
    "Taveta": 480,
    "Voi": 480,
    "Wundanyi": 480
  },
  "Tana River": {
    "Select your Neighbourhood": 0,
    "Bura": 480,
    "Hola": 480
  },
  "Tharaka - Nithi": {
    "Select your Neighbourhood": 0,
    "Chuka Town": 480
  },
  "Trans Nzoia": {
    "Select your Neighbourhood": 0,
    "Kitale": 480,
    "Moi's Bridge": 480
  },
  "Turkana": {
    "Select your Neighbourhood": 0,
    "Lodwar": 580
  },
  "Uasin Gishu": {
    "Select your Neighbourhood": 0,
    "Eldoret Town": 450,
    "Hawaii Munyaka": 450,
    "Huruma/ Road Block/ Maili Nne": 450,
    "KCC/ Ilula/ Kipkorgot": 450,
    "Kesses/ Moi University Main Campus": 450,
    "Kimumu/ University of Eldoret/ Marura": 450,
    "Kisumu Road/ Elgon View/ Langas/ Airport": 450,
    "Maili Tisa/ JuaKali/ Soi/ Nangili": 450,
    "Nairobi Rd/ Kapsoya/ MTRH": 450,
    "Tairi Mbili/ Maili Nne": 450,
    "Uganda Rd": 450
  },
  "Vihiga": {
    "Select your Neighbourhood": 0,
    "Chavakali": 480,
    "Luanda": 480,
    "Mbale": 480
  },
  "West Pokot": {
    "Select your Neighbourhood": 0,
    "Kapenguria": 520
  }
};

export const CITIES = Object.keys(SHIPPING_ZONES).filter(c => c !== "Select a City");

const STANDARD_NEIGHBOURHOODS = [
  'A.S.K. Showgrounds/Wanye',
  'Adams Arcade/ Dagoretti Corner',
  'Bahati/ Marisha/ Viwandani/ Jeri',
  'Buruburu/ Hanza/ Harambee',
  'Dagoretti South - Ngando',
  'Dagoretti South - Riruta',
  'Donholm/ Greenfields/ Kayole/ Nasra',
  'Embakasi - Fedha',
  'Embakasi East - Embakasi/ Utawala',
  'Embakasi North - Dandora/ Kariobangi',
  'Embakasi South - Bunyala Rd/ South B',
  'Embakasi South - Landimawe',
  'Githuria/ Kahawa Sukari',
  'Huruma/ Kiamaiko/ Mabatini/ Ngei',
  'Imara Daima/ Kwa Njega',
  'Imara Daima/ AA/ Maziwa/ Kwa Njega',
  'Kahawa Wendani/ Kenyatta University',
  'Kahawa West/ Githurai 44',
  'Kamukunji - Airbase',
  'Kamukunji - Carlifonia/ Eastleigh',
  'Kariobangi South/ Dandora/ Airbase',
  'Kasarani - Clay City/ Kasarani/ Mwiki',
  'Kibra - Jamhuri/ Woodley',
  'Kibra - Makina/ Sarangombe',
  'Komarock/ Kangundo Road/ Saika/ Obama',
  'Kwa Rueben/ Kware/ Pipeline',
  'Laini Saba/ Lindi/ Makina/ Sarangombe',
  'Langata - Dam Estate/ Nyayo Highrise/ Ngumo',
  'Langata - Mbangathi Way/ Ngumo',
  'Langata - Nairobi West/ South C',
  "Langata - Otiende/ Southlands/ St Mary's",
  'Lavington/ Kawangware/ Gatina',
  'Lavington/ Kawangware/ Gatina/ Waithaka',
  'Madiwa/ Pumwani',
  'Mihango/ Njiru/ Chokaa/ Ruai/ Kamulu',
  'Mutuini/ Rithimitu',
  'Railways/ Muthurwa/ BS/ OTC',
  'Roysambu/ Zimmerman',
  'Ruaraka - Babadogo/ Lucky Summer',
  'Ruaraka - Mathare North/ Survey/ Utalii',
  'Saika/ Obama/ Komarocks',
  'Starehe - Kariokor/ Ziwani',
  'Starehe - Ngara',
  'Starehe - Pangani',
  'Transami/ Airport North Road',
  'Umoja/ Tena Estate/ Nasra'
];

const EXPRESS_NEIGHBOURHOODS = [
  "CBD - GPO / City Market/ Nation Center",
  "CBD - Luthuli/ Afya Center/ R. Ngara",
  "CBD - UoN/ Globe/ Koja",
  "Gigiri/ Runda",
  'Kangemi - Loresho/ Kangemi',
  "Karen",
  "Kileleshwa/Kilimani",
  "Loresho",
  "Lower Kabete/ Kangemi/ Mountain View",
  'Mountain view/ Kangemi',
  "Spring valley/ Kyuna",
  "Upperhill - Community/ KNH",
  "Upperhill - Elgon Road/ Lower Hill",
  "Upperhill - Kiambere Road/ Mara Road",
  "Upperhill - Kiambere Road/ Mara Road/ Elgon Road/ Lower Hill",
  "Westlands - Central",
  "Westlands - Parklands/ Highridge"
];

export function meta() {
  return [
    { title: "Checkout - PetStore Kenya" },
    { name: "description", content: "Complete your order with secure payment options or via WhatsApp." },
  ];
}

export async function loader({ request }: { request: Request }) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const nameCookie = cookieHeader.split("; ").find(row => row.startsWith("customer_name="));
  const emailCookie = cookieHeader.split("; ").find(row => row.startsWith("customer_email="));

  const customerName = nameCookie ? decodeURIComponent(nameCookie.split("=")[1]) : "";
  const customerEmail = emailCookie ? decodeURIComponent(emailCookie.split("=")[1]) : "";

  let customerPhone = "";
  let loyalty = { configured: false, registered: false, balance: 0, total: 0, used: 0, conversionRate: 1.2 };
  if (customerEmail) {
    try {
      const res = await query(
        `SELECT phone FROM customers WHERE email = $1 LIMIT 1`,
        [customerEmail]
      );
      if (res.rows.length > 0) {
        customerPhone = res.rows[0].phone || "";
      }
    } catch (err) {
      console.error("Error prefetching customer phone:", err);
    }
  }

  const settingsPath = await import("path").then(p => p.default.join(process.cwd(), "content", "general-settings.json"));
  const fs = await import("fs").then(f => f.default);
  const recaptchaSiteKey = ""; // Temporarily disabled until console access
  let googleClientId = process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER";
  if (fs.existsSync(settingsPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      if (parsed.googleClientId) {
        googleClientId = parsed.googleClientId;
      }
    } catch (e) {}
  }

  if (customerEmail || customerPhone) {
    try {
      loyalty = await getLoyaltyPoints({ email: customerEmail, phone: customerPhone, fullname: customerName });
    } catch (err) {
      console.error("Error prefetching loyalty balance:", err);
    }
  }

  return { customerName, customerEmail, customerPhone, loyalty, recaptchaSiteKey, googleClientId };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const formType = formData.get("form_type")?.toString();

  // reCAPTCHA verification temporarily disabled until console access
  /*
  if (formType === "checkout_login" || formType === "checkout_google_login") {
    // Disabled reCAPTCHA check
  }
  */

  if (formType === "checkout_google_login") {
    const email = formData.get("email")?.toString().trim();
    const name = formData.get("name")?.toString().trim();

    if (!email || !name) {
      return data({ error: "Google authentication failed: Email and Name are required" }, { status: 400 });
    }

    const { query } = await import("../db.server");
    const res = await query("SELECT * FROM customers WHERE email = $1", [email]);
    if (res.rows.length === 0) {
      await query("INSERT INTO customers (name, email) VALUES ($1, $2)", [name, email]);
    } else {
      await query("UPDATE customers SET name = $1 WHERE email = $2", [name, email]);
    }

    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `customer_name=${encodeURIComponent(name)}; Path=/; SameSite=Lax; Max-Age=86400`
    );
    headers.append(
      "Set-Cookie",
      `customer_email=${encodeURIComponent(email)}; Path=/; SameSite=Lax; Max-Age=86400`
    );

    return redirect("/checkout", { headers });
  }

  if (formType === "checkout_login") {
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      return data({ error: "Email and password are required" }, { status: 400 });
    }

    let customerName = "";
    let customerEmail = "";

    try {
      const { authenticateWordPressCustomer, syncWordPressCustomer } = await import("../lib/wordpress-auth.server");
      const wpCustomer = await authenticateWordPressCustomer(email, password);
      await syncWordPressCustomer(wpCustomer);
      customerName = wpCustomer.name;
      customerEmail = wpCustomer.email;
    } catch (err: any) {
      try {
        const { authenticateLocalCustomer } = await import("../lib/db.server");
        const localUser = await authenticateLocalCustomer(email, password);
        customerName = localUser.name;
        customerEmail = localUser.email;
      } catch (localErr: any) {
        return data({ error: localErr.message || "Invalid email or password." }, { status: 401 });
      }
    }

    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `customer_name=${encodeURIComponent(customerName)}; Path=/; SameSite=Lax; Max-Age=86400`
    );
    headers.append(
      "Set-Cookie",
      `customer_email=${encodeURIComponent(customerEmail)}; Path=/; SameSite=Lax; Max-Age=86400`
    );

    return redirect("/checkout", { headers });
  }

  return {};
}

export default function CheckoutPage() {
  const { customerName, customerEmail, customerPhone, loyalty, recaptchaSiteKey, googleClientId } = useLoaderData<typeof loader>();
  const actionData = useActionData<any>();
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  // Split name for prefilling First/Last Name
  const nameParts = customerName ? customerName.split(" ") : ["", ""];
  const initialFirstName = nameParts[0] || "";
  const initialLastName = nameParts.slice(1).join(" ") || "";

  // Form states
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [selectedCity, setSelectedCity] = useState("Select a City");
  const [selectedZone, setSelectedZone] = useState("Select your Neighbourhood");
  const [streetAddress, setStreetAddress] = useState("");
  const [apartmentInfo, setApartmentInfo] = useState("");
  const [recipientEmail, setRecipientEmail] = useState(customerEmail || "");
  const [recipientPhone, setRecipientPhone] = useState(customerPhone || "");

  // Checkout Login states & handlers
  const [showCheckoutLogin, setShowCheckoutLogin] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginWidgetId, setLoginWidgetId] = useState<number | null>(null);
  const [showRecaptchaError, setShowRecaptchaError] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const loginFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (actionData?.error) {
      setShowRecaptchaError(true);
    }
  }, [actionData]);

  // Load Google Identity Services script
  useEffect(() => {
    if (typeof window === "undefined" || !googleClientId) return;

    const scriptId = "google-gsi-client";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [googleClientId]);

  const handleGoogleLogin = () => {
    if (!googleClientId || googleClientId === "YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER") {
      alert("Google Client ID is not configured. Please supply a valid Client ID.");
      return;
    }
    if (!(window as any).google || !(window as any).google.accounts) {
      alert("Google Sign-In is loading, please try again in a moment.");
      return;
    }

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: "email profile openid",
        prompt: "select_account",
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error("Google OAuth response error:", tokenResponse);
            return;
          }
          try {
            const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`);
            const profile = await res.json();
            
            if (profile.email) {
              const form = document.createElement("form");
              form.method = "post";
              
              const typeInput = document.createElement("input");
              typeInput.type = "hidden";
              typeInput.name = "form_type";
              typeInput.value = "checkout_google_login";
              form.appendChild(typeInput);
              
              const emailInput = document.createElement("input");
              emailInput.type = "hidden";
              emailInput.name = "email";
              emailInput.value = profile.email;
              form.appendChild(emailInput);
              
              const nameInput = document.createElement("input");
              nameInput.type = "hidden";
              nameInput.name = "name";
              nameInput.value = profile.name || `${profile.given_name || ""} ${profile.family_name || ""}`.trim();
              form.appendChild(nameInput);
              
              document.body.appendChild(form);
              form.submit();
            } else {
              alert("Could not retrieve email address from your Google Account.");
            }
          } catch (e) {
            console.error("Error fetching Google profile info:", e);
            alert("Error authenticating with Google.");
          }
        },
      });
      client.requestAccessToken();
    } catch (err) {
      console.error("Google authentication error:", err);
      alert("Failed to initialize Google Sign-in.");
    }
  };

  function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    setClientError(null);
    // reCAPTCHA temporarily disabled until console access
  }

  // Load and render Google reCAPTCHA v2 script and widgets
  useEffect(() => {
    if (typeof window === "undefined" || !recaptchaSiteKey || !showCheckoutLogin) return;

    // Load reCAPTCHA script dynamically
    const scriptId = "recaptcha-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const initRecaptchas = () => {
      if ((window as any).grecaptcha && (window as any).grecaptcha.render) {
        const loginEl = document.getElementById("recaptcha-checkout-login");

        if (loginEl && !loginEl.innerHTML) {
          try {
            const id = (window as any).grecaptcha.render("recaptcha-checkout-login", {
              sitekey: recaptchaSiteKey,
            });
            setLoginWidgetId(id);
          } catch (e) {
            console.error("Error rendering login recaptcha:", e);
          }
        }
      }
    };

    if ((window as any).grecaptcha && (window as any).grecaptcha.render) {
      initRecaptchas();
    } else {
      const interval = setInterval(() => {
        if ((window as any).grecaptcha && (window as any).grecaptcha.render) {
          initRecaptchas();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [recaptchaSiteKey, showCheckoutLogin]);



  // Custom Neighbourhood dropdown states
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [zoneSearch, setZoneSearch] = useState("");
  const [showModalZoneDropdown, setShowModalZoneDropdown] = useState(false);
  const [modalZoneSearch, setModalZoneSearch] = useState("");

  // Address Picker state and logic
  interface CustomerAddress {
    id: number;
    customer_email: string;
    first_name: string;
    last_name: string;
    city: string;
    neighbourhood: string;
    street_address: string;
    apartment_info?: string;
    phone: string;
    is_default: boolean;
  }

  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Address Modal states
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  // Modal form fields
  const [modalFirstName, setModalFirstName] = useState("");
  const [modalLastName, setModalLastName] = useState("");
  const [modalCity, setModalCity] = useState("Select a City");
  const [modalZone, setModalZone] = useState("Select your Neighbourhood");
  const [modalStreetAddress, setModalStreetAddress] = useState("");
  const [modalApartmentInfo, setModalApartmentInfo] = useState("");
  const [modalPhone, setModalPhone] = useState("");
  const [modalIsDefault, setModalIsDefault] = useState(false);

  const applyAddressToForm = (addr: CustomerAddress) => {
    setFirstName(addr.first_name);
    setLastName(addr.last_name);
    setSelectedCity(addr.city);
    setSelectedZone(addr.neighbourhood);
    setStreetAddress(addr.street_address);
    setApartmentInfo(addr.apartment_info || "");
    setRecipientPhone(addr.phone);
  };

  const reloadAddresses = async (selectIdAfterReload?: number) => {
    if (!customerEmail) return;
    try {
      const res = await fetch(`/api/addresses?email=${encodeURIComponent(customerEmail)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSavedAddresses(data);
        let nextSelected = selectIdAfterReload;
        if (!nextSelected) {
          if (selectedAddressId && data.some(a => a.id === selectedAddressId)) {
            nextSelected = selectedAddressId;
          } else {
            const def = data.find(a => a.is_default);
            nextSelected = def ? def.id : (data.length > 0 ? data[0].id : undefined);
          }
        }
        if (nextSelected) {
          setSelectedAddressId(nextSelected);
          const match = data.find(a => a.id === nextSelected);
          if (match) {
            applyAddressToForm(match);
            setIsEditingAddress(false);
          }
        } else if (data.length === 0) {
          setIsEditingAddress(true);
        }
      }
    } catch (err) {
      console.error("Error reloading addresses:", err);
    }
  };

  useEffect(() => {
    if (customerEmail) {
      reloadAddresses();
    }
  }, [customerEmail]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".address-dropdown-container")) {
        setShowDropdown(false);
      }
      if (!target.closest(".zone-dropdown-container")) {
        setShowZoneDropdown(false);
      }
      if (!target.closest(".modal-zone-dropdown-container")) {
        setShowModalZoneDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSetDefaultAddress = async (id: number) => {
    if (!customerEmail) return;
    try {
      const res = await fetch("/api/addresses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email: customerEmail })
      });
      const data = await res.json();
      if (data.success) {
        reloadAddresses();
      }
    } catch (err) {
      console.error("Error setting default address:", err);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!customerEmail) return;
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch("/api/addresses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email: customerEmail })
      });
      const data = await res.json();
      if (data.success) {
        if (selectedAddressId === id) {
          setSelectedAddressId(null);
        }
        reloadAddresses();
      }
    } catch (err) {
      console.error("Error deleting address:", err);
    }
  };

  const handleOpenEditAddress = (addr: CustomerAddress) => {
    setEditingAddress(addr);
    setModalFirstName(addr.first_name);
    setModalLastName(addr.last_name);
    setModalCity(addr.city);
    setModalZone(addr.neighbourhood);
    setModalStreetAddress(addr.street_address);
    setModalApartmentInfo(addr.apartment_info || "");
    setModalPhone(addr.phone);
    setModalIsDefault(addr.is_default);
    setShowAddressModal(true);
    setShowDropdown(false);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail) return;

    if (!modalFirstName.trim() || !modalLastName.trim() || !modalStreetAddress.trim() || !modalPhone.trim()) {
      alert("Please fill in all required fields.");
      return;
    }
    if (modalCity === "Select a City") {
      alert("Please select a city.");
      return;
    }
    if (modalZone === "Select your Neighbourhood") {
      alert("Please select a neighbourhood.");
      return;
    }

    const payload = {
      id: editingAddress?.id,
      email: customerEmail,
      firstName: modalFirstName.trim(),
      lastName: modalLastName.trim(),
      city: modalCity,
      neighbourhood: modalZone,
      streetAddress: modalStreetAddress.trim(),
      apartmentInfo: modalApartmentInfo.trim(),
      phone: modalPhone.trim(),
      isDefault: modalIsDefault
    };

    try {
      const isEdit = !!editingAddress;
      const res = await fetch("/api/addresses", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.address) {
        setShowAddressModal(false);
        reloadAddresses(data.address.id);
      } else {
        alert(data.error || "Failed to save address.");
      }
    } catch (err) {
      console.error("Error saving address:", err);
      alert("Failed to save address due to network error.");
    }
  };

  // Shipping Method selection (standard vs express)
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [productDetails, setProductDetails] = useState<Array<{ id: number; name: string; tags: Array<{ name: string; slug: string }> }>>([]);

  useEffect(() => {
    if (items.length > 0) {
      const ids = items.map(item => item.id).join(",");
      fetch(`/api/products-shipping?ids=${ids}`)
        .then(res => res.json())
        .then(data => setProductDetails(data))
        .catch(err => console.error("Error fetching product shipping info", err));
    }
  }, [items]);

  useEffect(() => {
    if (selectedCity !== "Nairobi" || !EXPRESS_NEIGHBOURHOODS.includes(selectedZone)) {
      setShippingMethod("standard");
    }
  }, [selectedCity, selectedZone]);

  // Optional Accordion states
  const [additionalAddress, setAdditionalAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPersonPhone, setContactPersonPhone] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // UI toggles and selections
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    discountAmount: number;
    allowFreeShipping: boolean;
  } | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"ipay" | "peach" | "lipampesa">("ipay");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loyaltyState, setLoyaltyState] = useState(loyalty);
  const [loyaltyInput, setLoyaltyInput] = useState("");
  const [appliedLoyaltyPoints, setAppliedLoyaltyPoints] = useState(0);
  const [loyaltyMessage, setLoyaltyMessage] = useState("");
  const [joiningLoyalty, setJoiningLoyalty] = useState(false);

  // Order submission states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successOrderNumber, setSuccessOrderNumber] = useState<number | null>(null);

  // Delivery calculations
  const now = new Date();
  const nairobiStr = now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
  const nairobiDate = new Date(nairobiStr);
  const currentHour = nairobiDate.getHours();
  const currentDay = nairobiDate.getDay();
  const isExpressTimeAvailable = (currentDay === 0 && currentHour < 15) || (currentDay !== 0 && currentHour >= 8 && currentHour < 15);

  const hasFreeShippingProduct = items.some(item => {
    const nameLower = item.name.toLowerCase();
    if (nameLower.includes("gift card") || nameLower.includes("donate") || nameLower.includes("thunder-free-delivery")) {
      return true;
    }
    const dbItem = productDetails.find(p => p.id === item.id);
    if (dbItem?.tags && Array.isArray(dbItem.tags)) {
      return dbItem.tags.some((t: any) => {
        const tagSlug = (t.slug || "").toLowerCase();
        const tagName = (t.name || "").toLowerCase();
        return tagSlug === "thunder-free-delivery" || tagSlug === "gift-card" || tagSlug === "donate" || tagName === "donate";
      });
    }
    return false;
  });

  const hasDonateProduct = items.some(item => {
    const nameLower = item.name.toLowerCase();
    if (nameLower.includes("donate")) return true;
    const dbItem = productDetails.find(p => p.id === item.id);
    if (dbItem?.tags && Array.isArray(dbItem.tags)) {
      return dbItem.tags.some((t: any) => {
        const tagSlug = (t.slug || "").toLowerCase();
        const tagName = (t.name || "").toLowerCase();
        return tagSlug === "donate" || tagName === "donate";
      });
    }
    return false;
  });

  let deliveryFee = 0;
  let deliveryFeeLabel = "Delivery Fee - Shipping will be calculated once a Neighbourhood is provided";
  let isNeighbourhoodProvided = false;

  const isAllDonation = items.length > 0 && items.every(item => item.name.toLowerCase().includes("donate"));

  if (isAllDonation) {
    deliveryFee = 0;
    deliveryFeeLabel = "Note: Donation products total shipping is free.";
    isNeighbourhoodProvided = true;
  } else if (selectedCity === "Select a City" || selectedZone === "Select your Neighbourhood" || !selectedZone) {
    deliveryFee = 0;
    deliveryFeeLabel = "Delivery Fee - Shipping will be calculated once a Neighbourhood is provided";
    isNeighbourhoodProvided = false;
  } else {
    isNeighbourhoodProvided = true;
    const cityZones = SHIPPING_ZONES[selectedCity];
    const zoneBaseFee = cityZones ? cityZones[selectedZone] ?? 0 : 0;

    let finalShippingMethod = shippingMethod;
    if (selectedCity !== "Nairobi" || !EXPRESS_NEIGHBOURHOODS.includes(selectedZone) || !isExpressTimeAvailable) {
      finalShippingMethod = "standard";
    }

    if (selectedCity === "Nairobi") {
      if (subtotal < 5000) {
        if (finalShippingMethod === "standard") {
          deliveryFee = zoneBaseFee;
          deliveryFeeLabel = `Delivery Fee (Standard) - ${selectedZone}`;
        } else {
          deliveryFee = zoneBaseFee + 200;
          deliveryFeeLabel = `Express Delivery Fee (2hr) - ${selectedZone}`;
        }
      } else {
        if (finalShippingMethod === "standard") {
          deliveryFee = 0;
          deliveryFeeLabel = "Free Shipping for orders above 5000";
        } else {
          deliveryFee = 500;
          deliveryFeeLabel = "Express Delivery Fee(2hr) on Free Shipping for orders above 5000";
        }
      }
    } else {
      if (cityZones && cityZones[selectedZone] !== undefined) {
        deliveryFee = zoneBaseFee;
        deliveryFeeLabel = `Flat Rate - ${selectedCity}`;
      } else {
        deliveryFee = 0;
        deliveryFeeLabel = "Delivery Fee - Calculated at checkout";
      }
    }
  }

  // Override delivery fee if coupon grants free shipping
  if (appliedCoupon?.allowFreeShipping && isNeighbourhoodProvided) {
    deliveryFee = 0;
    deliveryFeeLabel = `Free Shipping (${appliedCoupon.code} Coupon)`;
  }

  // Compute discount amount dynamically
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "percentage") {
      discountAmount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
    } else {
      discountAmount = Math.min(subtotal, appliedCoupon.discountValue);
    }
  }

  const loyaltyConversionRate = Number(loyaltyState?.conversionRate || 1.2);
  const loyaltyDiscountAmount = Math.min(subtotal - discountAmount, Math.round(appliedLoyaltyPoints * loyaltyConversionRate));
  const totalAmount = Math.max(0, subtotal + deliveryFee - discountAmount - loyaltyDiscountAmount);

  const handleApplyLoyaltyPoints = () => {
    const requested = Math.max(0, Math.floor(Number(loyaltyInput || 0)));
    const available = Math.max(0, Math.floor(Number(loyaltyState?.balance || 0)));
    const maxByCart = Math.floor(Math.max(0, subtotal - discountAmount) / loyaltyConversionRate);
    const usable = Math.min(requested, available, maxByCart);

    if (!loyaltyState?.registered) {
      setLoyaltyMessage("Join the loyalty program first to use PSK Cash.");
      return;
    }
    if (usable <= 0) {
      setAppliedLoyaltyPoints(0);
      setLoyaltyMessage("Enter loyalty points available in your balance.");
      return;
    }
    setAppliedLoyaltyPoints(usable);
    setLoyaltyInput(String(usable));
    setLoyaltyMessage(`Applied ${usable} points (-KES ${Math.round(usable * loyaltyConversionRate).toLocaleString()})`);
  };

  const handleJoinLoyalty = async () => {
    if (!recipientEmail.trim() && !recipientPhone.trim()) {
      setLoyaltyMessage("Please enter your email or phone number first.");
      return;
    }
    setJoiningLoyalty(true);
    setLoyaltyMessage("");
    try {
      const res = await fetch("/api/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "register",
          email: recipientEmail,
          phone: recipientPhone,
          fullname: `${firstName} ${lastName}`.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Could not join loyalty program.");
      setLoyaltyState(data.loyalty || { ...loyaltyState, registered: true });
      setLoyaltyMessage("Loyalty account activated. You can now earn and redeem PSK Cash.");
    } catch (error: any) {
      setLoyaltyMessage(error.message || "Could not join loyalty program.");
    } finally {
      setJoiningLoyalty(false);
    }
  };

  // Dynamically validate coupon code against database & API
  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      setCouponMessage("Please enter a coupon code.");
      setCouponSuccess(false);
      setAppliedCoupon(null);
      return;
    }

    try {
      const res = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal, email: recipientEmail })
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountAmount: data.discountAmount,
          allowFreeShipping: data.allowFreeShipping || false
        });
        setCouponMessage(data.message);
        setCouponSuccess(true);
      } else {
        setAppliedCoupon(null);
        setCouponMessage(data.message || "Invalid coupon code.");
        setCouponSuccess(false);
      }
    } catch (e) {
      setAppliedCoupon(null);
      setCouponMessage("Failed to validate coupon code.");
      setCouponSuccess(false);
    }
  };

  // Submit Order via API
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!firstName.trim()) {
      setErrorMessage("Please enter a first name.");
      return;
    }
    if (!lastName.trim()) {
      setErrorMessage("Please enter a last name.");
      return;
    }
    if (selectedCity === "Select a City") {
      setErrorMessage("Please select a city/county.");
      return;
    }
    if (!selectedZone || selectedZone === "Select your Neighbourhood") {
      setErrorMessage("Please select a delivery zone/neighbourhood.");
      return;
    }
    if (!streetAddress.trim()) {
      setErrorMessage("Please enter your street address.");
      return;
    }
    if (!recipientEmail.trim()) {
      setErrorMessage("Please enter an email address.");
      return;
    }
    if (!recipientPhone.trim()) {
      setErrorMessage("Please enter a phone number.");
      return;
    }
    if (contactPersonPhone.trim()) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,20}$/;
      if (!phoneRegex.test(contactPersonPhone.trim())) {
        setErrorMessage("Please enter a valid recipient phone number.");
        return;
      }
    }
    if (!agreedToTerms) {
      setErrorMessage("You must agree to the terms and conditions to proceed.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const orderItems = items.map(item => ({
        product_id: item.id,
        product_name: item.name,
        qty: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const fullCustomerName = `${firstName.trim()} ${lastName.trim()}`;
      const addressNotes = `Street: ${streetAddress}, Apt/Suite: ${apartmentInfo || "N/A"}. Additional: ${additionalAddress || "N/A"}. Contact: ${contactPerson || "N/A"} (${contactPersonPhone || "N/A"}). Instructions: ${deliveryInstructions || "N/A"}. General: ${orderNotes || "N/A"}`;

      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: fullCustomerName,
          customer_phone: recipientPhone,
          customer_email: recipientEmail,
          delivery_area: `${selectedCity} - ${selectedZone} (${shippingMethod === "express" ? "Express" : "Standard"})`,
          subtotal_kes: subtotal,
          delivery_fee_kes: deliveryFee,
          total_kes: totalAmount,
          payment_method: paymentMethod,
          notes: addressNotes,
          items: orderItems
        })
      });

      const data = await res.json();
      if (data.success && data.orderId) {
        setSuccessOrderNumber(data.orderId);
        clearCart();
      } else {
        let rawErr = (data.error || "").toString();
        let userFriendlyError = rawErr || "Failed to place order. Please try again.";
        if (rawErr.includes("violates unique constraint") || rawErr.includes("duplicate key") || rawErr.includes("customers_pkey")) {
          userFriendlyError = "An account with these contact details already exists. Please check your information or try placing your order again.";
        } else if (rawErr.includes("postgres") || rawErr.includes("database") || rawErr.includes("syntax error")) {
          userFriendlyError = "An error occurred while processing your order. Please try again or contact customer support.";
        }
        setErrorMessage(userFriendlyError);
      }
    } catch (err) {
      setErrorMessage("Network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit/Complete via WhatsApp
  const handleWhatsAppCheckout = () => {
    if (items.length === 0) return;

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Please enter first and last name.");
      return;
    }
    if (selectedCity === "Select a City") {
      setErrorMessage("Please select a city/county.");
      return;
    }
    if (!selectedZone || selectedZone === "Select your Neighbourhood") {
      setErrorMessage("Please select a delivery zone/neighbourhood.");
      return;
    }
    if (!streetAddress.trim()) {
      setErrorMessage("Please enter street address.");
      return;
    }
    if (!recipientPhone.trim()) {
      setErrorMessage("Please enter a phone number.");
      return;
    }
    if (contactPersonPhone.trim()) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,20}$/;
      if (!phoneRegex.test(contactPersonPhone.trim())) {
        setErrorMessage("Please enter a valid recipient phone number.");
        return;
      }
    }

    const lines = items.map(i => `• ${i.name} x${i.quantity} — KES ${(i.price * i.quantity).toLocaleString()}`).join("\n");
    const msg = encodeURIComponent(
      `Hi PetStore Kenya! I'd like to place an order via WhatsApp:\n\n${lines}\n\nSubtotal: KES ${subtotal.toLocaleString()}\nDelivery Fee (${deliveryFeeLabel}): KES ${deliveryFee.toLocaleString()}\nDiscount: KES ${(discountAmount + loyaltyDiscountAmount).toLocaleString()}\nTOTAL: KES ${totalAmount.toLocaleString()}\n\nName: ${firstName} ${lastName}\nPhone: ${recipientPhone}\nNeighbourhood: ${selectedZone} (${shippingMethod === "express" ? "Express Shipping" : "Standard Shipping"})\nAddress: ${streetAddress}, ${apartmentInfo || ""}\nNotes: ${orderNotes || "None"}`
    );
    window.open(`https://wa.me/254795350292?text=${msg}`, "_blank");
    clearCart();
    navigate("/");
  };

  // Input styling
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.6rem 0.85rem",
    border: "1px solid #bbd2e8",
    borderRadius: "4px",
    outline: "none",
    boxSizing: "border-box",
    fontSize: "14px",
    fontFamily: "var(--font-sans)",
    color: "#444"
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "14px",
    fontFamily: "var(--font-sans)",
    fontWeight: 500,
    color: "#333",
    marginBottom: "0.4rem"
  };

  return (
    <>
      <Navbar />

      <div className="page" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>

          {/* Header Banner */}
          <PageHeader title="Checkout" />

          {/* Returning Customer Alert Banner */}
          {!customerEmail && (
            <>
              <div style={{
                border: "1px solid #dcdcdc",
                borderTop: "3px solid #1E5DA7",
                padding: "1rem 1.25rem",
                background: "#f7f7f7",
                fontSize: "0.9rem",
                color: "#515151",
                display: "flex",
                alignItems: "center",
                marginBottom: showCheckoutLogin ? "0.5rem" : "2rem",
                fontFamily: "var(--font-sans)"
              }}>
                <i className="fa fa-file-text-o" style={{ color: "#1E5DA7", fontSize: "14px", marginRight: "10px" }} />
                <span>
                  Returning customer? <span 
                    onClick={() => setShowCheckoutLogin(!showCheckoutLogin)} 
                    style={{ color: "#1E5DA7", textDecoration: "none", fontWeight: 500, cursor: "pointer", transition: "color 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#154275"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#1E5DA7"}
                  >
                    Click here to login
                  </span>
                </span>
              </div>

              {/* Checkout Login Form Card */}
              {showCheckoutLogin && (
                <div
                  ref={loginFormRef}
                  style={{
                    border: "1px solid #dcdcdc",
                    borderRadius: "4px",
                    padding: "2.5rem 2rem",
                    background: "#ffffff",
                    marginBottom: "2rem"
                  }}
                >
                  <p style={{ fontSize: "14px", color: "#515151", lineHeight: 1.6, marginBottom: "1.5rem", fontFamily: "var(--font-sans)" }}>
                    If you have shopped with us before, please enter your details below. If you are a new customer, please proceed to the Billing section.
                  </p>

                  <Form method="post" onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <input type="hidden" name="form_type" value="checkout_login" />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", marginBottom: "0.5rem" }}>
                      {/* Left Column: Username & Recaptcha */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.9rem", color: "#333333", fontWeight: 500, marginBottom: "0.5rem", fontFamily: "var(--font-sans)" }}>
                            Username or email <span style={{ color: "#ef4444" }}>*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            required
                            style={{
                              width: "100%",
                              padding: "0.75rem 0.85rem",
                              border: "1px solid #cccccc",
                              borderRadius: "4px",
                              background: "#ffffff",
                              outline: "none",
                              fontSize: "14px",
                              boxSizing: "border-box",
                              fontFamily: "var(--font-sans)",
                              color: "#333333",
                              transition: "border-color 0.2s"
                            }}
                            onFocus={(e) => e.target.style.borderColor = "#7ea4d3"}
                            onBlur={(e) => e.target.style.borderColor = "#cccccc"}
                          />
                        </div>

                        {/* reCAPTCHA Temporarily Disabled: <div id="recaptcha-checkout-login" style={{ marginTop: "0.25rem" }}></div> */}
                      </div>

                      {/* Right Column: Password */}
                      <div>
                        <label style={{ display: "block", fontSize: "0.9rem", color: "#333333", fontWeight: 500, marginBottom: "0.5rem", fontFamily: "var(--font-sans)" }}>
                          Password <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <div style={{ position: "relative" }}>
                          <input
                            type={showLoginPassword ? "text" : "password"}
                            name="password"
                            required
                            style={{
                              width: "100%",
                              padding: "0.75rem 0.85rem",
                              paddingRight: "2.5rem",
                              border: "1px solid #cccccc",
                              borderRadius: "4px",
                              background: "#ffffff",
                              outline: "none",
                              fontSize: "14px",
                              boxSizing: "border-box",
                              fontFamily: "var(--font-sans)",
                              color: "#333333",
                              transition: "border-color 0.2s"
                            }}
                            onFocus={(e) => e.target.style.borderColor = "#7ea4d3"}
                            onBlur={(e) => e.target.style.borderColor = "#cccccc"}
                          />
                          <span
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            style={{
                              position: "absolute",
                              right: "12px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              cursor: "pointer",
                              color: "#777777"
                            }}
                          >
                            <i className={showLoginPassword ? "fa fa-eye-slash" : "fa fa-eye"} style={{ fontSize: "15px" }}></i>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Remember me checkbox */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                      <input
                        type="checkbox"
                        id="checkout-rememberme"
                        name="rememberme"
                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                      />
                      <label htmlFor="checkout-rememberme" style={{ fontSize: "0.9rem", color: "#333333", cursor: "pointer", userSelect: "none", fontFamily: "var(--font-sans)" }}>
                        Remember me
                      </label>
                    </div>

                    {(clientError || actionData?.error) && (
                      <div style={{
                        background: "rgba(239, 68, 68, 0.05)",
                        border: "1px solid #ef4444",
                        color: "#ef4444",
                        fontSize: "0.85rem",
                        padding: "0.75rem",
                        borderRadius: "4px",
                        marginTop: "0.5rem",
                        marginBottom: "0.5rem"
                      }}>
                        ⚠️ {clientError || actionData?.error}
                      </div>
                    )}

                    {/* Login Button */}
                    <div style={{ marginTop: "0.5rem" }}>
                      <button
                        type="submit"
                        style={{
                          background: "#eae9ec",
                          color: "#515151",
                          border: "1px solid #dcdcdc",
                          borderRadius: "4px",
                          padding: "0.75rem 2rem",
                          fontWeight: "600",
                          fontSize: "0.9rem",
                          cursor: "pointer",
                          outline: "none",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#dfdedf"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#eae9ec"}
                      >
                        Login
                      </button>
                    </div>

                    {/* Lost Password Link */}
                    <div>
                      <Link to="/my-account" style={{ color: "#3b82f6", fontSize: "0.9rem", textDecoration: "none", fontWeight: 500, fontFamily: "var(--font-sans)" }}>
                        Lost your password?
                      </Link>
                    </div>

                    {/* Continue with Google Button */}
                    <div style={{ marginTop: "1.5rem" }}>
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        style={{
                          background: "#000000",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          padding: "0.75rem 1.5rem",
                          fontWeight: "600",
                          fontSize: "0.9rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "10px",
                          width: "fit-content",
                          fontFamily: "var(--font-sans)",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#222222"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#000000"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        Continue with Google
                      </button>
                    </div>
                  </Form>
                </div>
              )}
            </>
          )}

          {successOrderNumber ? (
            /* Success View */
            <div style={{
              textAlign: "center",
              padding: "4rem 2rem",
              border: "1px solid #dcdcdc",
              borderRadius: "8px",
              background: "#ffffff",
              marginBottom: "3rem"
            }}>
              <span style={{ fontSize: "4rem" }}>🎉</span>
              <h2 style={{ fontSize: "1.8rem", color: "#1E5DA7", margin: "1rem 0", fontFamily: "var(--font-sans)", fontWeight: "bold" }}>
                Thank you! Your order has been placed.
              </h2>
              <p style={{ color: "#515151", fontSize: "1.1rem", marginBottom: "2rem" }}>
                Your Order ID is <strong>#{successOrderNumber}</strong>. We are processing it and will contact you shortly.
              </p>
              <Link to="/shop" className="btn-primary" style={{
                background: "#1E5DA7",
                color: "#ffffff",
                padding: "0.6rem 2rem",
                borderRadius: "20px",
                textDecoration: "none",
                fontWeight: "bold"
              }}>
                Continue Shopping
              </Link>
            </div>
          ) : items.length === 0 ? (
            /* Empty state check */
            <div style={{
              textAlign: "center",
              padding: "4rem 2rem",
              border: "1px solid #dcdcdc",
              borderRadius: "8px",
              background: "#ffffff",
              marginBottom: "3rem"
            }}>
              <span style={{ fontSize: "4rem" }}>🛒</span>
              <h2 style={{ fontSize: "1.8rem", color: "#1E5DA7", margin: "1rem 0" }}>Your cart is empty</h2>
              <p style={{ color: "#777777", marginBottom: "2rem" }}>Please add some products to your cart before checking out.</p>
              <Link to="/shop" style={{
                background: "#1E5DA7",
                color: "#ffffff",
                padding: "0.6rem 2rem",
                borderRadius: "20px",
                textDecoration: "none",
                fontWeight: "bold"
              }}>
                Go to Shop
              </Link>
            </div>
          ) : (
            /* Checkout Form Grid */
            <>
              {/* Smart Free Delivery Upsell Banner */}
              {(() => {
                const currentMonth = nairobiDate.getMonth() + 1;
                const currentYear = nairobiDate.getFullYear();
                const isCampaignActive = (currentYear === 2026 && (currentMonth === 4 || currentMonth === 5));
                if (!isCampaignActive || hasFreeShippingProduct || (selectedCity !== "Select a City" && selectedCity !== "Nairobi")) return null;

                const threshold = 1500;
                const remaining = threshold - subtotal;
                const progressPct = Math.min(100, Math.max(0, (subtotal / threshold) * 100));

                return (
                  <div style={{
                    gridColumn: "span 2",
                    margin: "0 0 25px",
                    padding: "18px 22px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)",
                    border: "1px solid #86efac",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.1)",
                  }}>
                    {subtotal >= threshold ? (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "28px" }}>🎉</span>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#15803d" }}>
                              You've unlocked FREE Delivery!
                            </p>
                            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#166534" }}>
                              Enjoy free standard shipping on this order within Nairobi.
                            </p>
                          </div>
                        </div>
                        <div style={{ marginTop: "12px", background: "#bbf7d0", borderRadius: "99px", height: "8px", overflow: "hidden" }}>
                          <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg, #22c55e, #16a34a)", borderRadius: "99px", transition: "width 0.5s ease" }} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "28px" }}>🚚</span>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#15803d" }}>
                              You're <span style={{ color: "#dc2626" }}>KES {remaining.toLocaleString()}</span> away from FREE Delivery!
                            </p>
                            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#166534" }}>
                              Add KES {remaining.toLocaleString()} more to your cart to enjoy free standard shipping in Nairobi.
                            </p>
                          </div>
                        </div>
                        <div style={{ marginTop: "12px", background: "#e5e7eb", borderRadius: "99px", height: "8px", overflow: "hidden" }}>
                          <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg, #f97316, #22c55e)", borderRadius: "99px", transition: "width 0.5s ease" }} />
                        </div>
                        <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#6b7280", textAlign: "right" }}>
                          KES {subtotal.toLocaleString()} / KES 1,500
                        </p>
                      </>
                    )}
                    <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#9ca3af", textAlign: "center" }}>
                      🏷️ Limited-time free delivery for orders above KES 1500 &bull; Valid for Nairobi deliveries only
                    </p>
                  </div>
                );
              })()}

              <form className="checkout-form" onSubmit={handlePlaceOrder}>

                {/* Left Column: Delivery Address Form */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

                  <div>
                    <h3 style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "1.4rem",
                      color: "#1E5DA7",
                      textAlign: "center",
                      margin: "0 0 1.5rem 0",
                      fontWeight: "bold",
                      borderBottom: "2px solid #eaeaea",
                      paddingBottom: "0.5rem"
                    }}>
                      DELIVERY ADDRESS
                    </h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                      {customerEmail && !isEditingAddress && selectedAddressId && savedAddresses.some(a => a.id === selectedAddressId) ? (
                        /* Case 1: Compact View Mode */
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <button
                              type="button"
                              onClick={() => setIsEditingAddress(true)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#1E5DA7",
                                fontWeight: "bold",
                                fontSize: "0.95rem",
                                cursor: "pointer",
                                padding: 0,
                                textDecoration: "underline"
                              }}
                            >
                              Edit This
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAddress(null);
                                setModalFirstName("");
                                setModalLastName("");
                                setModalCity("Select a City");
                                setModalZone("Select your Neighbourhood");
                                setModalStreetAddress("");
                                setModalApartmentInfo("");
                                setModalPhone("");
                                setModalIsDefault(savedAddresses.length === 0);
                                setShowAddressModal(true);
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#1E5DA7",
                                fontWeight: "bold",
                                fontSize: "14px",
                                fontFamily: "var(--font-sans)",
                                cursor: "pointer"
                              }}
                            >
                              + Add Address
                            </button>
                          </div>

                          <div className="address-dropdown-container" style={{ position: "relative" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "1.25rem 1.5rem",
                                border: "1px solid #bbd2e8",
                                borderRadius: "8px",
                                background: "#ffffff",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                              }}
                            >
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", alignItems: "flex-start" }}>
                                <span style={{ fontWeight: "bold", fontSize: "15px", fontFamily: "var(--font-sans)", color: "#333" }}>
                                  Shipping Address
                                </span>
                                <span style={{ fontSize: "14px", fontFamily: "var(--font-sans)", color: "#555" }}>
                                  {(() => {
                                    const active = savedAddresses.find(a => a.id === selectedAddressId)!;
                                    return `${active.first_name} ${active.last_name}, ${active.neighbourhood}, ${active.city}`;
                                  })()}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowDropdown(!showDropdown)}
                                style={{
                                  background: "#1E5DA7",
                                  color: "#ffffff",
                                  border: "none",
                                  padding: "0.5rem 1.25rem",
                                  borderRadius: "25px",
                                  fontWeight: "bold",
                                  fontSize: "0.9rem",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px"
                                }}
                              >
                                Select <span style={{ fontSize: "0.8rem" }}>▼</span>
                              </button>
                            </div>

                            {showDropdown && (
                              <div style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                background: "#ffffff",
                                border: "1px solid #bbd2e8",
                                borderRadius: "4px",
                                marginTop: "4px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                zIndex: 1000,
                                maxHeight: "280px",
                                overflowY: "auto"
                              }}>
                                {savedAddresses.map(addr => {
                                  const isSelected = addr.id === selectedAddressId;
                                  return (
                                    <div
                                      key={addr.id}
                                      onClick={() => {
                                        setSelectedAddressId(addr.id);
                                        applyAddressToForm(addr);
                                        setShowDropdown(false);
                                      }}
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "0.65rem 1rem",
                                        borderBottom: "1px solid #f0f0f0",
                                        cursor: "pointer",
                                        background: isSelected ? "#f4f8fa" : "#ffffff"
                                      }}
                                    >
                                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", flex: 1, marginRight: "0.5rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                          <span style={{ fontWeight: "bold", fontSize: "14px", fontFamily: "var(--font-sans)", color: "#333" }}>
                                            {addr.first_name} {addr.last_name}
                                          </span>
                                          {addr.is_default && (
                                            <span style={{ color: "#eab308", fontSize: "12px", fontWeight: "bold" }}>★</span>
                                          )}
                                        </div>
                                        <span style={{ fontSize: "13px", fontFamily: "var(--font-sans)", color: "#666" }}>
                                          {addr.street_address}{addr.apartment_info ? `, ${addr.apartment_info}` : ""}, {addr.neighbourhood}, {addr.city}
                                        </span>
                                        <span style={{ fontSize: "12px", fontFamily: "var(--font-sans)", color: "#888" }}>
                                          Phone: {addr.phone}
                                        </span>
                                      </div>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={e => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={() => handleSetDefaultAddress(addr.id)}
                                          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: addr.is_default ? "#eab308" : "#ccc", fontSize: "1.1rem" }}
                                          title="Set as Default"
                                        >
                                          ★
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditAddress(addr)}
                                          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "#1E5DA7", fontSize: "0.95rem" }}
                                          title="Edit Address"
                                        >
                                          ✎
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteAddress(addr.id)}
                                          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "#ef4444", fontSize: "0.95rem" }}
                                          title="Delete Address"
                                        >
                                          🗑
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Case 2: Full Form / Edit Mode */
                        <>
                          {customerEmail && (
                            <div className="address-dropdown-container" style={{ position: "relative", marginBottom: "0.5rem" }}>
                              <label style={{ ...labelStyle, fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <span>Saved Addresses</span>
                                  {savedAddresses.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setIsEditingAddress(false)}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        color: "#1E5DA7",
                                        fontWeight: "bold",
                                        fontSize: "14px",
                                        fontFamily: "var(--font-sans)",
                                        cursor: "pointer",
                                        padding: 0,
                                        textDecoration: "underline"
                                      }}
                                    >
                                      Back to Saved Address
                                    </button>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAddress(null);
                                    setModalFirstName("");
                                    setModalLastName("");
                                    setModalCity("Select a City");
                                    setModalZone("Select your Neighbourhood");
                                    setModalStreetAddress("");
                                    setModalApartmentInfo("");
                                    setModalPhone("");
                                    setModalIsDefault(savedAddresses.length === 0);
                                    setShowAddressModal(true);
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#1E5DA7",
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                    fontFamily: "var(--font-sans)",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                >
                                  <span style={{ fontSize: "1.1rem" }}>+</span> Add Address
                                </button>
                              </label>

                              <div
                                onClick={() => setShowDropdown(!showDropdown)}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "0.75rem 1rem",
                                  border: "1px solid #1E5DA7",
                                  borderRadius: "4px",
                                  background: "#ffffff",
                                  cursor: "pointer",
                                  fontFamily: "var(--font-sans)",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                                }}
                              >
                                <span style={{ fontSize: "14px", fontFamily: "var(--font-sans)", color: "#333" }}>
                                  {selectedAddressId && savedAddresses.find(a => a.id === selectedAddressId) ? (
                                    (() => {
                                      const active = savedAddresses.find(a => a.id === selectedAddressId)!;
                                      return `${active.first_name} ${active.last_name} — ${active.street_address}, ${active.neighbourhood}, ${active.city}`;
                                    })()
                                  ) : (
                                    "Select a saved address..."
                                  )}
                                </span>
                                <span style={{ fontSize: "0.7rem", color: "#1E5DA7" }}>{showDropdown ? "▲" : "▼"}</span>
                              </div>

                              {showDropdown && (
                                <div style={{
                                  position: "absolute",
                                  top: "100%",
                                  left: 0,
                                  right: 0,
                                  background: "#ffffff",
                                  border: "1px solid #bbd2e8",
                                  borderRadius: "4px",
                                  marginTop: "4px",
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                  zIndex: 1000,
                                  maxHeight: "280px",
                                  overflowY: "auto"
                                }}>
                                  {savedAddresses.length === 0 ? (
                                    <div style={{ padding: "1rem", fontStyle: "italic", color: "#666", fontSize: "14px", fontFamily: "var(--font-sans)", textAlign: "center" }}>
                                      No saved addresses found. Click "Add Address" to create one.
                                    </div>
                                  ) : (
                                    savedAddresses.map(addr => {
                                      const isSelected = addr.id === selectedAddressId;
                                      return (
                                        <div
                                          key={addr.id}
                                          onClick={() => {
                                            setSelectedAddressId(addr.id);
                                            applyAddressToForm(addr);
                                            setShowDropdown(false);
                                            setIsEditingAddress(false);
                                          }}
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            padding: "0.65rem 1rem",
                                            borderBottom: "1px solid #f0f0f0",
                                            cursor: "pointer",
                                            background: isSelected ? "#f4f8fa" : "#ffffff"
                                          }}
                                        >
                                          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", flex: 1, marginRight: "0.5rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                              <span style={{ fontWeight: "bold", fontSize: "14px", fontFamily: "var(--font-sans)", color: "#333" }}>
                                                {addr.first_name} {addr.last_name}
                                              </span>
                                              {addr.is_default && (
                                                <span style={{ color: "#eab308", fontSize: "0.75rem", fontWeight: "bold" }}>★</span>
                                              )}
                                            </div>
                                            <span style={{ fontSize: "13px", fontFamily: "var(--font-sans)", color: "#666" }}>
                                              {addr.street_address}{addr.apartment_info ? `, ${addr.apartment_info}` : ""}, {addr.neighbourhood}, {addr.city}
                                            </span>
                                            <span style={{ fontSize: "12px", fontFamily: "var(--font-sans)", color: "#888" }}>
                                              Phone: {addr.phone}
                                            </span>
                                          </div>
                                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={e => e.stopPropagation()}>
                                            <button
                                              type="button"
                                              onClick={() => handleSetDefaultAddress(addr.id)}
                                              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: addr.is_default ? "#eab308" : "#ccc", fontSize: "1.1rem" }}
                                              title="Set as Default"
                                            >
                                              ★
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleOpenEditAddress(addr)}
                                              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "#1E5DA7", fontSize: "14px" }}
                                              title="Edit Address"
                                            >
                                              ✎
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteAddress(addr.id)}
                                              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "#ef4444", fontSize: "14px" }}
                                              title="Delete Address"
                                            >
                                              🗑
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* First & Last name rows */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                            <div>
                              <label style={labelStyle}>
                                First name <span style={{ color: "#ef4444" }}>*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                style={inputStyle}
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>
                                Last name <span style={{ color: "#ef4444" }}>*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                style={inputStyle}
                              />
                            </div>
                          </div>

                          {/* Country */}
                          <div>
                            <label style={labelStyle}>
                              Country <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <div style={{ fontSize: "14px", fontFamily: "var(--font-sans)", fontWeight: "bold", color: "#333", padding: "0.2rem 0" }}>
                              Kenya
                            </div>
                          </div>

                          {/* City/County */}
                          <div>
                            <label style={labelStyle}>
                              City/County <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <select
                              required
                              value={selectedCity}
                              onChange={e => {
                                setSelectedCity(e.target.value);
                                setSelectedZone("Select your Neighbourhood");
                                setZoneSearch("");
                              }}
                              style={inputStyle}
                            >
                              <option value="Select a City">Select a City</option>
                              {CITIES.map(city => (
                                <option key={city} value={city}>{city}</option>
                              ))}
                            </select>
                          </div>

                          {/* Neighbourhood */}
                          <div>
                            <label style={labelStyle}>
                              Neighbourhood <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <div className="zone-dropdown-container" style={{ position: "relative" }}>
                              <div
                                onClick={() => setShowZoneDropdown(!showZoneDropdown)}
                                style={{
                                  ...inputStyle,
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  cursor: "pointer",
                                  background: "#ffffff",
                                  userSelect: "none"
                                }}
                              >
                                <span>{selectedZone}</span>
                                <span style={{ fontSize: "0.7rem", color: "#1E5DA7" }}>{showZoneDropdown ? "▲" : "▼"}</span>
                              </div>

                              {showZoneDropdown && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    background: "#ffffff",
                                    border: "1px solid #bbd2e8",
                                    borderRadius: "4px",
                                    marginTop: "4px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                    zIndex: 1000,
                                    maxHeight: "280px",
                                    display: "flex",
                                    flexDirection: "column"
                                  }}
                                >
                                  {/* Search Input */}
                                  {selectedCity && SHIPPING_ZONES[selectedCity] && Object.keys(SHIPPING_ZONES[selectedCity]).length > 5 && (
                                    <div style={{ padding: "6px", borderBottom: "1px solid #f0f0f0" }}>
                                      <input
                                        type="text"
                                        placeholder="Search neighborhood..."
                                        value={zoneSearch}
                                        onChange={(e) => setZoneSearch(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                          width: "100%",
                                          padding: "6px 10px",
                                          border: "1px solid #dcdcdc",
                                          borderRadius: "4px",
                                          fontSize: "13px",
                                          outline: "none",
                                          boxSizing: "border-box"
                                        }}
                                      />
                                    </div>
                                  )}

                                  {/* Options List */}
                                  <div style={{ overflowY: "auto", flex: 1 }}>
                                    {(() => {
                                      const zones = selectedCity && SHIPPING_ZONES[selectedCity]
                                        ? Object.keys(SHIPPING_ZONES[selectedCity])
                                        : ["Select your Neighbourhood"];

                                      const filtered = zones.filter(zone =>
                                        zone.toLowerCase().includes(zoneSearch.toLowerCase())
                                      );

                                      if (filtered.length === 0) {
                                        return (
                                          <div style={{ padding: "10px", fontSize: "13px", color: "#888", textAlign: "center" }}>
                                            No match found
                                          </div>
                                        );
                                      }

                                      return filtered.map(zone => {
                                        const isSelected = zone === selectedZone;
                                        return (
                                          <div
                                            key={zone}
                                            onClick={() => {
                                              setSelectedZone(zone);
                                              setShowZoneDropdown(false);
                                              setZoneSearch("");
                                            }}
                                            style={{
                                              padding: "0.65rem 1rem",
                                              fontSize: "14px",
                                              fontFamily: "var(--font-sans)",
                                              cursor: "pointer",
                                              background: isSelected ? "#f4f8fa" : "#ffffff",
                                              color: isSelected ? "#1E5DA7" : "#444",
                                              fontWeight: isSelected ? "bold" : "normal",
                                              transition: "background 0.2s"
                                            }}
                                            onMouseEnter={(e) => {
                                              if (zone !== selectedZone) e.currentTarget.style.background = "#f7fafc";
                                            }}
                                            onMouseLeave={(e) => {
                                              if (zone !== selectedZone) e.currentTarget.style.background = "#ffffff";
                                            }}
                                          >
                                            {zone}
                                          </div>
                                        );
                                      });
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>



                          {/* Nairobi Express vs Standard Delivery Option Selector */}
                          {!hasFreeShippingProduct && selectedCity === "Nairobi" && EXPRESS_NEIGHBOURHOODS.includes(selectedZone) && (
                            <div style={{
                              padding: "1rem",
                              border: "1px solid #bbd2e8",
                              borderRadius: "4px",
                              background: "#f7fafd",
                              marginTop: "0.5rem"
                            }}>
                              <label style={{ ...labelStyle, fontWeight: "bold" }}>
                                Delivery Option
                              </label>
                              {isExpressTimeAvailable ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "14px", fontFamily: "var(--font-sans)" }}>
                                    <input
                                      type="radio"
                                      name="radio_delivery"
                                      value="standard"
                                      checked={shippingMethod === "standard"}
                                      onChange={() => setShippingMethod("standard")}
                                      style={{ marginRight: "8px" }}
                                    />
                                    Standard Shipping
                                  </label>
                                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "14px", fontFamily: "var(--font-sans)" }}>
                                    <input
                                      type="radio"
                                      name="radio_delivery"
                                      value="express"
                                      checked={shippingMethod === "express"}
                                      onChange={() => setShippingMethod("express")}
                                      style={{ marginRight: "8px" }}
                                    />
                                    Express Shipping (3hr) 8am - 3pm
                                  </label>
                                </div>
                              ) : (
                                <p style={{ margin: "0.5rem 0 0 0", fontSize: "13px", fontFamily: "var(--font-sans)", color: "#666", lineHeight: 1.4 }}>
                                  Express shipping is only available between 8AM - 3PM, and on Saturdays until 11AM, excluding Sundays, and Public Holidays. Turnaround time is 2 hours.
                                </p>
                              )}
                            </div>
                          )}

                          {/* Street Address */}
                          <div>
                            <label style={labelStyle}>
                              Street Address <span style={{ color: "#ef4444" }}>**</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="House number, & street name"
                              value={streetAddress}
                              onChange={e => setStreetAddress(e.target.value)}
                              style={inputStyle}
                            />
                          </div>

                          {/* Apartment details */}
                          <div>
                            <label style={{ ...labelStyle, fontWeight: "normal" }}>
                              Apartment, suite, unit etc. <span style={{ color: "#888", fontSize: "0.8rem" }}>(optional)</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Apartment, suite, unit etc."
                              value={apartmentInfo}
                              onChange={e => setApartmentInfo(e.target.value)}
                              style={inputStyle}
                            />
                          </div>

                          {/* Email Field */}
                          <div>
                            <label style={labelStyle}>
                              Email <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <input
                              type="email"
                              required
                              placeholder="me@mail.com"
                              value={recipientEmail}
                              onChange={e => setRecipientEmail(e.target.value)}
                              style={inputStyle}
                            />
                          </div>

                          {/* Phone Field */}
                          <div>
                            <label style={labelStyle}>
                              Phone <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <input
                              type="tel"
                              required
                              placeholder="+254 000 000 000"
                              value={recipientPhone}
                              onChange={e => setRecipientPhone(e.target.value)}
                              style={inputStyle}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Additional Delivery Information Accordion */}
                  <div style={{
                    border: "1px solid #dcdcdc",
                    borderRadius: "8px",
                    background: "#ffffff",
                    overflow: "hidden"
                  }}>
                    {/* Accordion Header */}
                    <div
                      onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                      style={{
                        padding: "1rem 1.5rem",
                        background: "#fdfdfd",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: showAdditionalInfo ? "1px solid #eaeaea" : "none",
                        userSelect: "none"
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "bold", color: "#1E5DA7" }}>
                        📋 ADDITIONAL DELIVERY INFORMATION (OPTIONAL)
                      </span>
                      <span style={{ color: "#1E5DA7" }}>{showAdditionalInfo ? "▲" : "▼"}</span>
                    </div>

                    {/* Accordion Body */}
                    {showAdditionalInfo && (
                      <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "14px", fontFamily: "var(--font-sans)", color: "#666", marginBottom: "0.4rem" }}>
                            Additional Address Information <span style={{ fontSize: "12px", color: "#999" }}>(optional)</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Building name, floor, apartment number, etc."
                            value={additionalAddress}
                            onChange={e => setAdditionalAddress(e.target.value)}
                            style={inputStyle}
                          />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "14px", fontFamily: "var(--font-sans)", color: "#666", marginBottom: "0.4rem" }}>
                              Recipient Contact <span style={{ fontSize: "12px", color: "#999" }}>(optional)</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Name of the person receiving"
                              value={contactPerson}
                              onChange={e => setContactPerson(e.target.value)}
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "14px", fontFamily: "var(--font-sans)", color: "#666", marginBottom: "0.4rem" }}>
                              Recipient Phone <span style={{ fontSize: "12px", color: "#999" }}>(optional)</span>
                            </label>
                            <input
                              type="tel"
                              placeholder="Phone number of the recipient"
                              value={contactPersonPhone}
                              onChange={e => setContactPersonPhone(e.target.value)}
                              style={inputStyle}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "14px", fontFamily: "var(--font-sans)", color: "#666", marginBottom: "0.4rem" }}>
                            Delivery Instructions <span style={{ fontSize: "0.8rem", color: "#999" }}>(optional)</span>
                          </label>
                          <textarea
                            placeholder="Special delivery instructions, gate codes, etc."
                            rows={3}
                            value={deliveryInstructions}
                            onChange={e => setDeliveryInstructions(e.target.value)}
                            style={{
                              ...inputStyle,
                              resize: "vertical"
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* General Order Notes */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontFamily: "var(--font-sans)", color: "#333", fontWeight: "bold", marginBottom: "0.5rem" }}>
                      Order notes (optional)
                    </label>
                    <textarea
                      placeholder="Notes about your order, e.g. special notes for delivery."
                      rows={4}
                      value={orderNotes}
                      onChange={e => setOrderNotes(e.target.value)}
                      style={{
                        ...inputStyle,
                        resize: "vertical"
                      }}
                    />
                  </div>

                </div>

                {/* Right Column: Order Summary & Checkout CTA */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                  <h3 style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "1.4rem",
                    color: "#1a5ca3",
                    textAlign: "center",
                    margin: 0,
                    fontWeight: "bold",
                    borderBottom: "2px solid #eaeaea",
                    paddingBottom: "0.5rem"
                  }}>
                    YOUR ORDERS
                  </h3>

                  {/* Order Summary Box */}
                  <div style={{
                    border: "1px solid #1E5DA7",
                    borderRadius: "4px",
                    overflow: "hidden",
                    background: "#ffffff"
                  }}>
                    {/* Header Row */}
                    <div style={{
                      background: "#1E5DA7",
                      color: "#ffffff",
                      padding: "0.75rem 1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: "bold",
                      fontSize: "0.95rem"
                    }}>
                      <span>Order Summary Total</span>
                      <span>{totalAmount.toLocaleString()}KSh</span>
                    </div>

                    {/* Products label */}
                    <div style={{
                      background: "#f4f8fa",
                      padding: "0.5rem 1rem",
                      fontWeight: "bold",
                      fontSize: "0.85rem",
                      color: "#333"
                    }}>
                      Product
                    </div>

                    {/* List of items */}
                    <div style={{ borderBottom: "1px solid #eaeaea" }}>
                      {items.map(item => (
                        <div key={item.id} style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "0.65rem 1rem",
                          fontSize: "0.85rem",
                          borderBottom: "1px solid #f9f9f9"
                        }}>
                          <span style={{ color: "#515151" }}>
                            <span style={{ fontSize: "15px", fontWeight: 500 }}>{item.name}</span>{" "}
                            <strong style={{ fontSize: "13px" }}>× {item.quantity}</strong>
                          </span>
                          <span style={{ color: "#333", fontWeight: 500 }}>{(item.price * item.quantity).toLocaleString()}KSh</span>
                        </div>
                      ))}
                    </div>

                    {/* Subtotal Row */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.75rem 1rem",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                      borderBottom: "1px solid #eaeaea"
                    }}>
                      <span>Subtotal</span>
                      <span>{subtotal.toLocaleString()}KSh</span>
                    </div>

                    {/* Discount Row (If Coupon Applied) */}
                    {appliedCoupon && discountAmount > 0 && (
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                        color: "#16a34a",
                        background: "#f0fdf4",
                        borderBottom: "1px solid #dcfce7"
                      }}>
                        <span>Discount ({appliedCoupon.code})</span>
                        <span>-{discountAmount.toLocaleString()}KSh</span>
                      </div>
                    )}

                    {appliedLoyaltyPoints > 0 && loyaltyDiscountAmount > 0 && (
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                        color: "#16a34a",
                        background: "#f0fdf4",
                        borderBottom: "1px solid #dcfce7"
                      }}>
                        <span>PSK Cash</span>
                        <span>-{loyaltyDiscountAmount.toLocaleString()}KSh</span>
                      </div>
                    )}

                    {/* PSK Cash Row */}
                    {/* Coupon Box */}
                    <div style={{
                      padding: "0.75rem 1rem",
                      borderBottom: "1px solid #eaeaea",
                      background: "#ffffff"
                    }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="text"
                          placeholder="Enter Coupon code"
                          value={couponCode}
                          onChange={e => setCouponCode(e.target.value)}
                          style={{
                            flex: 1,
                            padding: "0.4rem 0.75rem",
                            border: "1px solid #c2c2c2",
                            borderRadius: "4px",
                            outline: "none",
                            fontSize: "0.85rem"
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          style={{
                            background: "#1053a0",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "20px",
                            padding: "0.4rem 1.2rem",
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                          }}
                        >
                          Apply coupon
                        </button>
                      </div>
                      {couponMessage && (
                        <div style={{ fontSize: "0.8rem", color: couponSuccess ? "#16a34a" : "#ef4444", marginTop: "0.4rem", fontWeight: 500 }}>
                          {couponMessage}
                        </div>
                      )}
                    </div>

                    {/* Delivery Fee Notice Row */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.75rem 1rem",
                      borderBottom: "1px solid #eaeaea",
                      fontSize: "14px",
                      color: "#515151",
                      alignItems: "center"
                    }}>
                      <span style={{
                        maxWidth: "80%",
                        lineHeight: 1.3,
                        fontWeight: !isNeighbourhoodProvided ? "bold" : "normal",
                        color: !isNeighbourhoodProvided ? "#000000" : "#515151"
                      }}>
                        {deliveryFeeLabel}
                      </span>
                      <span style={{ fontWeight: "bold" }}>
                        {isNeighbourhoodProvided ? `${deliveryFee.toLocaleString()}KSh` : "0KSh"}
                      </span>
                    </div>



                    {/* Total Row */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.85rem 1rem",
                      fontWeight: "bold",
                      fontSize: "1.05rem",
                      color: "#333"
                    }}>
                      <span>Total</span>
                      <span>{totalAmount.toLocaleString()}KSh</span>
                    </div>
                  </div>

                  {/* Loyalty Points & PSK Cash Box */}
                  <div style={{
                    border: "1px solid #dcdcdc",
                    borderRadius: "4px",
                    padding: "1rem",
                    background: "#ffffff"
                  }}>
                    <div style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#333", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      🎁 Loyalty Points & PSK Cash
                    </div>
                    {customerEmail || recipientEmail ? (
                      loyaltyState?.registered ? (
                        <>
                          <div style={{ color: "#515151", fontSize: "0.8rem", lineHeight: 1.4, marginTop: "0.6rem", marginBottom: "0.75rem" }}>
                            Balance: <strong>{Number(loyaltyState.balance || 0).toLocaleString()} points</strong> ≈ KES {Math.round(Number(loyaltyState.balance || 0) * loyaltyConversionRate).toLocaleString()}.
                          </div>
                          {appliedLoyaltyPoints > 0 && (
                            <div style={{ background: "#f0fdf4", color: "#166534", padding: "0.5rem", borderRadius: "4px", fontSize: "0.8rem", marginBottom: "0.65rem", display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                              <span>Applied: {appliedLoyaltyPoints} points (-KES {loyaltyDiscountAmount.toLocaleString()})</span>
                              <button type="button" onClick={() => { setAppliedLoyaltyPoints(0); setLoyaltyInput(""); setLoyaltyMessage(""); }} style={{ border: 0, background: "transparent", color: "#b91c1c", fontWeight: "bold", cursor: "pointer" }}>Reset</button>
                            </div>
                          )}
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input
                              type="number"
                              min="0"
                              max={Number(loyaltyState.balance || 0)}
                              placeholder="Add points"
                              value={loyaltyInput}
                              onChange={e => setLoyaltyInput(e.target.value)}
                              style={{ flex: 1, padding: "0.5rem", border: "1px solid #c2c2c2", borderRadius: "4px", fontSize: "0.85rem" }}
                            />
                            <button type="button" onClick={handleApplyLoyaltyPoints} style={{ background: "#1053a0", color: "#fff", border: 0, borderRadius: "4px", padding: "0.5rem 1rem", fontWeight: "bold", cursor: "pointer" }}>Apply</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ color: "#515151", fontSize: "0.8rem", lineHeight: 1.4, marginTop: "0.6rem", marginBottom: "1rem" }}>
                            Create your free loyalty account to earn points on this order and redeem PSK Cash later.
                          </div>
                          <button type="button" disabled={joiningLoyalty} onClick={handleJoinLoyalty} style={{ background: "#1053a0", color: "#ffffff", border: "none", borderRadius: "4px", padding: "0.55rem 1rem", fontWeight: "bold", fontSize: "0.85rem", cursor: joiningLoyalty ? "not-allowed" : "pointer", width: "100%" }}>
                            {joiningLoyalty ? "Joining..." : "Join Now"}
                          </button>
                        </>
                      )
                    ) : (
                      <>
                        <div style={{ color: "#515151", fontSize: "0.8rem", lineHeight: 1.4, marginTop: "0.6rem", marginBottom: "1rem" }}>
                          Earn points with every purchase and redeem them for discounts. Login to view and use your loyalty points.
                        </div>
                        <button type="button" onClick={() => { setShowCheckoutLogin(true); setTimeout(() => loginFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100); }} style={{ background: "#ffffff", color: "#1E5DA7", border: "1px solid #bbd2e8", borderRadius: "4px", padding: "0.5rem 1rem", fontWeight: "bold", fontSize: "0.85rem", cursor: "pointer", width: "100%" }}>
                          Login to view your points
                        </button>
                      </>
                    )}
                    {loyaltyMessage && <div style={{ marginTop: "0.55rem", fontSize: "0.8rem", color: loyaltyMessage.includes("Applied") || loyaltyMessage.includes("activated") ? "#16a34a" : "#b45309", fontWeight: 500 }}>{loyaltyMessage}</div>}
                  </div>

                  {/* Payment Option radios */}
                  <div style={{
                    border: "1px solid #dcdcdc",
                    borderRadius: "4px",
                    padding: "1.5rem",
                    background: "#ffffff"
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                      {/* iPay Option */}
                      <div>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" }}>
                          <input
                            type="radio"
                            name="payment_method"
                            checked={paymentMethod === "ipay"}
                            onChange={() => setPaymentMethod("ipay")}
                            style={{ cursor: "pointer" }}
                          />
                          iPay
                        </label>

                        {/* Merchant Logos */}
                        <img
                          src="/assets/payment_channels.png"
                          alt="iPay Payment Channels"
                          style={{
                            height: "80px",
                            marginLeft: "1.5rem",
                            marginTop: "0.25rem",
                            marginBottom: "0.5rem",
                            display: "block"
                          }}
                        />

                        {paymentMethod === "ipay" && (
                          <div style={{
                            background: "#eae8f3",
                            color: "#333333",
                            padding: "0.85rem",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                            lineHeight: 1.4,
                            marginLeft: "1.5rem",
                            borderLeft: "4px solid #1E5DA7"
                          }}>
                            Place order and pay using (M-PESA, Airtel Money, Kenswitch, VISA, MasterCard) Powered by www.ipayafrica.com
                          </div>
                        )}
                      </div>

                      {/* Peach Payments Option */}
                      <div>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" }}>
                          <input
                            type="radio"
                            name="payment_method"
                            checked={paymentMethod === "peach"}
                            onChange={() => setPaymentMethod("peach")}
                            style={{ cursor: "pointer" }}
                          />
                          Peach Payments
                        </label>
                      </div>

                      {/* Lipa na M-PESA Option */}
                      <div>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" }}>
                          <input
                            type="radio"
                            name="payment_method"
                            checked={paymentMethod === "lipampesa"}
                            onChange={() => setPaymentMethod("lipampesa")}
                            style={{ cursor: "pointer" }}
                          />
                          Lipa na M-PESA <span style={{ color: "#25d366", fontSize: "0.85rem", fontWeight: "900", marginLeft: "0.5rem" }}>LIPA NA m-pesa</span>
                        </label>
                      </div>

                    </div>

                    {/* Terms & Conditions Checkbox */}
                    <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                      <input
                        type="checkbox"
                        id="terms"
                        checked={agreedToTerms}
                        onChange={e => setAgreedToTerms(e.target.checked)}
                        style={{ marginTop: "0.2rem", cursor: "pointer" }}
                      />
                      <label htmlFor="terms" style={{ fontSize: "0.85rem", color: "#333", cursor: "pointer", userSelect: "none" }}>
                        I have read and agree to the website <Link to="/terms-and-conditions" target="_blank" style={{ color: "#1e5da7", textDecoration: "underline", cursor: "pointer" }}>terms and conditions</Link> *
                      </label>
                    </div>

                    {errorMessage && (
                      <div style={{ background: "#fdf2f2", border: "1px solid #f5c2c2", padding: "0.75rem", borderRadius: "4px", color: "#ef4444", fontSize: "0.85rem", marginTop: "1rem" }}>
                        {errorMessage}
                      </div>
                    )}

                    {/* Place Order CTA Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        background: "#00c853",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "4px",
                        padding: "0.75rem",
                        width: "100%",
                        fontWeight: "bold",
                        fontSize: "1rem",
                        cursor: submitting ? "not-allowed" : "pointer",
                        marginTop: "1.2rem",
                        textTransform: "uppercase",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                        outline: "none"
                      }}
                    >
                      {submitting ? "Placing Order..." : "Place Order"}
                    </button>

                  </div>

                  {/* Complete Order via WhatsApp */}
                  <button
                    type="button"
                    onClick={handleWhatsAppCheckout}
                    style={{
                      background: "#4caf50",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "20px",
                      padding: "0.75rem",
                      width: "100%",
                      fontWeight: "bold",
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      outline: "none"
                    }}
                  >
                    <i className="fa fa-whatsapp" style={{ fontSize: "18px" }}></i> Complete Order via WhatsApp
                  </button>

                </div>

              </form>
            </>
          )}

        </div>
      </div>

      {showAddressModal && (
        <div
          className="address-modal-overlay"
          onClick={() => setShowAddressModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999,
            backdropFilter: "blur(4px)"
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "650px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#f8fafc",
              borderTopLeftRadius: "12px",
              borderTopRightRadius: "12px"
            }}>
              <h3 style={{
                margin: 0,
                fontFamily: "var(--font-sans)",
                fontSize: "1.25rem",
                color: "#1E5DA7",
                fontWeight: "bold"
              }}>
                {editingAddress ? "EDIT ADDRESS" : "ADD NEW ADDRESS"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  color: "#6b7280",
                  cursor: "pointer",
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAddress} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              {/* Form fields: First / Last Name */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
                <div>
                  <label style={labelStyle}>First Name <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    type="text"
                    required
                    value={modalFirstName}
                    onChange={e => setModalFirstName(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Last Name <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    type="text"
                    required
                    value={modalLastName}
                    onChange={e => setModalLastName(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* City and Neighbourhood */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
                <div>
                  <label style={labelStyle}>City/County <span style={{ color: "#ef4444" }}>*</span></label>
                  <select
                    required
                    value={modalCity}
                    onChange={e => {
                      setModalCity(e.target.value);
                      setModalZone("Select your Neighbourhood");
                      setModalZoneSearch("");
                    }}
                    style={inputStyle}
                  >
                    <option value="Select a City">Select a City</option>
                    {CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Neighbourhood <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="modal-zone-dropdown-container" style={{ position: "relative" }}>
                    <div
                      onClick={() => setShowModalZoneDropdown(!showModalZoneDropdown)}
                      style={{
                        ...inputStyle,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        background: "#ffffff",
                        userSelect: "none"
                      }}
                    >
                      <span>{modalZone}</span>
                      <span style={{ fontSize: "0.7rem", color: "#1E5DA7" }}>{showModalZoneDropdown ? "▲" : "▼"}</span>
                    </div>

                    {showModalZoneDropdown && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          background: "#ffffff",
                          border: "1px solid #bbd2e8",
                          borderRadius: "4px",
                          marginTop: "4px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          zIndex: 1000,
                          maxHeight: "200px",
                          display: "flex",
                          flexDirection: "column"
                        }}
                      >
                        {/* Search Input */}
                        {modalCity && SHIPPING_ZONES[modalCity] && Object.keys(SHIPPING_ZONES[modalCity]).length > 5 && (
                          <div style={{ padding: "6px", borderBottom: "1px solid #f0f0f0" }}>
                            <input
                              type="text"
                              placeholder="Search neighborhood..."
                              value={modalZoneSearch}
                              onChange={(e) => setModalZoneSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: "100%",
                                padding: "6px 10px",
                                border: "1px solid #dcdcdc",
                                borderRadius: "4px",
                                fontSize: "13px",
                                outline: "none",
                                boxSizing: "border-box"
                              }}
                            />
                          </div>
                        )}

                        {/* Options List */}
                        <div style={{ overflowY: "auto", flex: 1 }}>
                          {(() => {
                            const zones = modalCity && SHIPPING_ZONES[modalCity]
                              ? Object.keys(SHIPPING_ZONES[modalCity])
                              : ["Select your Neighbourhood"];

                            const filtered = zones.filter(zone =>
                              zone.toLowerCase().includes(modalZoneSearch.toLowerCase())
                            );

                            if (filtered.length === 0) {
                              return (
                                <div style={{ padding: "10px", fontSize: "13px", color: "#888", textAlign: "center" }}>
                                  No match found
                                </div>
                              );
                            }

                            return filtered.map(zone => {
                              const isSelected = zone === modalZone;
                              return (
                                <div
                                  key={zone}
                                  onClick={() => {
                                    setModalZone(zone);
                                    setShowModalZoneDropdown(false);
                                    setModalZoneSearch("");
                                  }}
                                  style={{
                                    padding: "0.65rem 1rem",
                                    fontSize: "14px",
                                    fontFamily: "var(--font-sans)",
                                    cursor: "pointer",
                                    background: isSelected ? "#f4f8fa" : "#ffffff",
                                    color: isSelected ? "#1E5DA7" : "#444",
                                    fontWeight: isSelected ? "bold" : "normal",
                                    transition: "background 0.2s"
                                  }}
                                  onMouseEnter={(e) => {
                                    if (zone !== modalZone) e.currentTarget.style.background = "#f7fafc";
                                  }}
                                  onMouseLeave={(e) => {
                                    if (zone !== modalZone) e.currentTarget.style.background = "#ffffff";
                                  }}
                                >
                                  {zone}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label style={labelStyle}>Street Address <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  type="text"
                  required
                  placeholder="House number & street name"
                  value={modalStreetAddress}
                  onChange={e => setModalStreetAddress(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Apartment Details */}
              <div>
                <label style={{ ...labelStyle, fontWeight: "normal" }}>Apartment, suite, unit etc. <span style={{ color: "#888", fontSize: "0.8rem" }}>(optional)</span></label>
                <input
                  type="text"
                  placeholder="Apartment, suite, unit etc."
                  value={modalApartmentInfo}
                  onChange={e => setModalApartmentInfo(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={labelStyle}>Phone <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  type="tel"
                  required
                  placeholder="+254 000 000 000"
                  value={modalPhone}
                  onChange={e => setModalPhone(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Default checkbox */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="modal_default"
                  checked={modalIsDefault}
                  onChange={e => setModalIsDefault(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                <label htmlFor="modal_default" style={{ fontSize: "0.85rem", color: "#333", cursor: "pointer", userSelect: "none" }}>
                  Set as default address
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  style={{
                    padding: "0.6rem 1.5rem",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    cursor: "pointer",
                    fontWeight: "bold",
                    color: "#374151"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "0.6rem 2rem",
                    borderRadius: "4px",
                    border: "none",
                    background: "#00c853",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
