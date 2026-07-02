import { Link, useLoaderData, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { query } from "../db.server";
import { useCart } from "../context/cart";
import PageHeader from "../components/PageHeader";

const SHIPPING_ZONES: Record<string, Record<string, number>> = {
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

const CITIES = Object.keys(SHIPPING_ZONES).filter(c => c !== "Select a City");

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
    { title: "Checkout — PetStore Kenya" },
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

  return { customerName, customerEmail, customerPhone };
}

export default function CheckoutPage() {
  const { customerName, customerEmail, customerPhone } = useLoaderData<typeof loader>();
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
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"ipay" | "peach" | "lipampesa">("ipay");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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

  const hasCoupon = appliedDiscount > 0;

  if (hasFreeShippingProduct) {
    deliveryFee = 0;
    deliveryFeeLabel = "Free shipping is available for this order.";
    isNeighbourhoodProvided = true;
  } else if (hasDonateProduct) {
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

    if (hasCoupon && finalShippingMethod === "standard") {
      deliveryFee = 0;
      deliveryFeeLabel = "Delivery Fee waived with coupon";
    } else if (selectedCity === "Nairobi") {
      const currentMonth = nairobiDate.getMonth() + 1;
      const currentYear = nairobiDate.getFullYear();
      const isCampaignActive = (currentYear === 2026 && (currentMonth === 4 || currentMonth === 5));

      if (isCampaignActive && subtotal >= 1500) {
        if (finalShippingMethod === "standard") {
          deliveryFee = 0;
          deliveryFeeLabel = "🚚 Free Delivery on orders above KES 1,500!";
        } else {
          deliveryFee = 200 + 300;
          deliveryFeeLabel = "Express Delivery Fee (2hr) - Campaign";
        }
      } else if (subtotal < 1500) {
        if (finalShippingMethod === "standard") {
          deliveryFee = zoneBaseFee;
          deliveryFeeLabel = `Delivery Fee (Standard) - Nairobi < 1500/-`;
        } else {
          deliveryFee = zoneBaseFee + 200;
          deliveryFeeLabel = `Express Delivery Fee (2hr) - Nairobi < 1500/-`;
        }
      } else {
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

  const discountAmount = Math.round(subtotal * appliedDiscount);
  const totalAmount = Math.max(0, subtotal + deliveryFee - discountAmount);

  // Apply a sample coupon code
  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === "PETSTORE10") {
      setAppliedDiscount(0.1);
      setCouponMessage("10% discount applied successfully!");
    } else if (couponCode.trim()) {
      setCouponMessage("Invalid coupon code.");
      setAppliedDiscount(0);
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
        setErrorMessage(data.error || "Failed to place order.");
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
      `Hi PetStore Kenya! I'd like to place an order via WhatsApp:\n\n${lines}\n\nSubtotal: KES ${subtotal.toLocaleString()}\nDelivery Fee (${deliveryFeeLabel}): KES ${deliveryFee.toLocaleString()}\nDiscount: KES ${discountAmount.toLocaleString()}\nTOTAL: KES ${totalAmount.toLocaleString()}\n\nName: ${firstName} ${lastName}\nPhone: ${recipientPhone}\nNeighbourhood: ${selectedZone} (${shippingMethod === "express" ? "Express Shipping" : "Standard Shipping"})\nAddress: ${streetAddress}, ${apartmentInfo || ""}\nNotes: ${orderNotes || "None"}`
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
    fontSize: "0.95rem",
    color: "#444"
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.9rem",
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
            <div style={{
              border: "1px solid #dcdcdc",
              padding: "0.85rem 1rem",
              background: "#fdfdfd",
              fontSize: "0.9rem",
              color: "#515151",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "2rem"
            }}>
              <i className="fa fa-info-circle" style={{ color: "#1053a0" }} />
              <span>
                Returning customer? <Link to="/my-account" style={{ color: "#1053a0", textDecoration: "none", fontWeight: 500 }}>Click here to login</Link>
              </span>
            </div>
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
              <h2 style={{ fontSize: "2rem", color: "#1053a0", margin: "1rem 0", fontFamily: '"Patrick Hand", cursive' }}>
                Thank you! Your order has been placed.
              </h2>
              <p style={{ color: "#515151", fontSize: "1.1rem", marginBottom: "2rem" }}>
                Your Order ID is <strong>#{successOrderNumber}</strong>. We are processing it and will contact you shortly.
              </p>
              <Link to="/shop" className="btn-primary" style={{
                background: "#1053a0",
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
              <h2 style={{ fontSize: "1.8rem", color: "#1053a0", margin: "1rem 0" }}>Your cart is empty</h2>
              <p style={{ color: "#777777", marginBottom: "2rem" }}>Please add some products to your cart before checking out.</p>
              <Link to="/shop" style={{
                background: "#1053a0",
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

              <form onSubmit={handlePlaceOrder} style={{ display: "grid", gridTemplateColumns: "1fr 450px", gap: "3.5rem", alignItems: "start" }}>

                {/* Left Column: Delivery Address Form */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

                  <div>
                    <h3 style={{
                      fontFamily: '"Patrick Hand", cursive',
                      fontSize: "1.6rem",
                      color: "#1a5ca3",
                      textAlign: "center",
                      margin: "0 0 1.5rem 0",
                      fontWeight: "bold",
                      borderBottom: "2px solid #eaeaea",
                      paddingBottom: "0.5rem"
                    }}>
                      DELIVERY ADDRESS
                    </h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>

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

                      {/* Static Country */}
                      <div>
                        <label style={labelStyle}>
                          Country <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <div style={{ fontSize: "1.05rem", fontWeight: "bold", color: "#333", padding: "0.2rem 0" }}>
                          Kenya
                        </div>
                      </div>

                      {/* City / County selection */}
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
                          }}
                          style={inputStyle}
                        >
                          <option value="Select a City">Select a City</option>
                          {CITIES.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>

                      {/* Neighbourhood selection */}
                      <div>
                        <label style={labelStyle}>
                          Neighbourhood <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <select
                          required
                          value={selectedZone}
                          onChange={e => setSelectedZone(e.target.value)}
                          style={inputStyle}
                        >
                          {selectedCity && SHIPPING_ZONES[selectedCity] ? (
                            Object.keys(SHIPPING_ZONES[selectedCity]).map(zone => {
                              const fee = SHIPPING_ZONES[selectedCity][zone];
                              return (
                                <option key={zone} value={zone}>
                                  {zone === "Select your Neighbourhood"
                                    ? zone
                                    : `${zone} (Fee: ${fee} KSh)`}
                                </option>
                              );
                            })
                          ) : (
                            <option value="Select your Neighbourhood">Select your Neighbourhood</option>
                          )}
                        </select>
                      </div>

                      {/* Free shipping product message */}
                      {hasFreeShippingProduct && (
                        <div style={{
                          padding: "0.85rem 1rem",
                          background: "#e6f4ea",
                          color: "#137333",
                          border: "1px solid #c2e7cc",
                          borderRadius: "4px",
                          fontSize: "0.9rem",
                          fontWeight: 500,
                          marginTop: "0.5rem"
                        }}>
                          Free shipping is available for this order.
                        </div>
                      )}

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
                              <label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "0.95rem" }}>
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
                              <label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "0.95rem" }}>
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
                            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem", color: "#666", lineHeight: 1.4 }}>
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

                      {/* Email and Phone side by side */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
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
                      </div>

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
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "bold", color: "#1a5ca3" }}>
                        📋 ADDITIONAL DELIVERY INFORMATION (OPTIONAL)
                      </span>
                      <span style={{ color: "#1a5ca3" }}>{showAdditionalInfo ? "▲" : "▼"}</span>
                    </div>

                    {/* Accordion Body */}
                    {showAdditionalInfo && (
                      <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.85rem", color: "#666", marginBottom: "0.4rem" }}>
                            Additional Address Information <span style={{ fontSize: "0.8rem", color: "#999" }}>(optional)</span>
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
                            <label style={{ display: "block", fontSize: "0.85rem", color: "#666", marginBottom: "0.4rem" }}>
                              Recipient Contact <span style={{ fontSize: "0.8rem", color: "#999" }}>(optional)</span>
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
                            <label style={{ display: "block", fontSize: "0.85rem", color: "#666", marginBottom: "0.4rem" }}>
                              Recipient Phone <span style={{ fontSize: "0.8rem", color: "#999" }}>(optional)</span>
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
                          <label style={{ display: "block", fontSize: "0.85rem", color: "#666", marginBottom: "0.4rem" }}>
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
                    <label style={{ display: "block", fontSize: "0.85rem", color: "#333", fontWeight: "bold", marginBottom: "0.5rem" }}>
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
                    fontFamily: '"Patrick Hand", cursive',
                    fontSize: "1.6rem",
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
                    border: "1px solid #1a5ca3",
                    borderRadius: "4px",
                    overflow: "hidden",
                    background: "#ffffff"
                  }}>
                    {/* Header Row */}
                    <div style={{
                      background: "#1a5ca3",
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
                          <span style={{ color: "#515151" }}>{item.name} <strong>× {item.quantity}</strong></span>
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
                        <div style={{ fontSize: "0.8rem", color: appliedDiscount > 0 ? "green" : "red", marginTop: "0.4rem" }}>
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
                      fontSize: "0.8rem",
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

                    {/* Applied Discount Row */}
                    {appliedDiscount > 0 && (
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        borderBottom: "1px solid #eaeaea",
                        fontSize: "0.9rem",
                        color: "green",
                        fontWeight: 500
                      }}>
                        <span>Discount (10%)</span>
                        <span>-{discountAmount.toLocaleString()}KSh</span>
                      </div>
                    )}

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
                    <div style={{
                      color: "#515151",
                      fontSize: "0.8rem",
                      lineHeight: 1.4,
                      marginTop: "0.6rem",
                      marginBottom: "1rem"
                    }}>
                      Earn points with every purchase and redeem them for discounts. Login to your PetStore Kenya account to view and use your loyalty points.
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/my-account")}
                      style={{
                        background: "#ffffff",
                        color: "#1a5ca3",
                        border: "1px solid #bbd2e8",
                        borderRadius: "4px",
                        padding: "0.5rem 1rem",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        width: "100%"
                      }}
                    >
                      Login to view your points
                    </button>
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
                        <div style={{ display: "flex", gap: "0.4rem", margin: "0.4rem 0 0.4rem 1.5rem", flexWrap: "wrap" }}>
                          <span style={{ background: "#f0f0f0", padding: "0.2rem 0.5rem", borderRadius: "3px", fontSize: "0.75rem", fontWeight: "bold" }}>M-Pesa</span>
                          <span style={{ background: "#f0f0f0", padding: "0.2rem 0.5rem", borderRadius: "3px", fontSize: "0.75rem", fontWeight: "bold" }}>Airtel</span>
                          <span style={{ background: "#f0f0f0", padding: "0.2rem 0.5rem", borderRadius: "3px", fontSize: "0.75rem", fontWeight: "bold" }}>Kenswitch</span>
                          <span style={{ background: "#f0f0f0", padding: "0.2rem 0.5rem", borderRadius: "3px", fontSize: "0.75rem", fontWeight: "bold" }}>Visa</span>
                          <span style={{ background: "#f0f0f0", padding: "0.2rem 0.5rem", borderRadius: "3px", fontSize: "0.75rem", fontWeight: "bold" }}>MasterCard</span>
                        </div>

                        {paymentMethod === "ipay" && (
                          <div style={{
                            background: "#eae8f3",
                            color: "#333333",
                            padding: "0.85rem",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                            lineHeight: 1.4,
                            marginLeft: "1.5rem",
                            borderLeft: "4px solid #1a5ca3"
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

      <Footer />
    </>
  );
}
