import { createContext, useContext, useState, ReactNode } from "react";

type Language = "it" | "en" | "es" | "fr" | "de";

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  it: {
    // Common
    "app.title": "CryptoBank",
    "common.loading": "Caricamento...",
    "common.save": "Salva",
    "common.cancel": "Annulla",
    "common.logout": "Esci",
    "common.language": "Lingua",
    
    // Navigation
    "nav.home": "Home",
    "nav.trading": "Trading",
    "nav.profile": "Profilo",
    "nav.admin": "Admin",
    
    // Dashboard
    "dashboard.totalBalance": "Saldo Totale",
    "dashboard.deposit": "Deposita",
    "dashboard.withdraw": "Preleva",
    "dashboard.buy": "Acquista",
    "dashboard.swap": "Swap",
    "dashboard.cryptoWallet": "Portafoglio Crypto",
    "dashboard.fiatAccounts": "Conti Fiat",
    "dashboard.recentTransactions": "Transazioni Recenti",
    
    // Trading
    "trading.title": "Trading & Exchange",
    "trading.search": "Cerca asset...",
    "trading.recommended": "Consigliati",
    "trading.allAssets": "Tutti gli Asset",
    "trading.invest": "Investi",
    
    // Profile
    "profile.title": "Il Mio Profilo",
    "profile.personalInfo": "Informazioni Personali",
    "profile.kyc": "Verifica KYC",
    "profile.paymentMethods": "Metodi di Pagamento",
    "profile.addCard": "Aggiungi Carta",
    "profile.addBank": "Aggiungi Conto Bancario",
    
    // Auth
    "auth.login": "Accedi",
    "auth.signup": "Registrati",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.fullName": "Nome Completo",
    "auth.dateOfBirth": "Data di Nascita",
    "auth.address": "Indirizzo",
  },
  en: {
    "app.title": "CryptoBank",
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.logout": "Logout",
    "common.language": "Language",
    
    "nav.home": "Home",
    "nav.trading": "Trading",
    "nav.profile": "Profile",
    "nav.admin": "Admin",
    
    "dashboard.totalBalance": "Total Balance",
    "dashboard.deposit": "Deposit",
    "dashboard.withdraw": "Withdraw",
    "dashboard.buy": "Buy",
    "dashboard.swap": "Swap",
    "dashboard.cryptoWallet": "Crypto Wallet",
    "dashboard.fiatAccounts": "Fiat Accounts",
    "dashboard.recentTransactions": "Recent Transactions",
    
    "trading.title": "Trading & Exchange",
    "trading.search": "Search assets...",
    "trading.recommended": "Recommended",
    "trading.allAssets": "All Assets",
    "trading.invest": "Invest",
    
    "profile.title": "My Profile",
    "profile.personalInfo": "Personal Information",
    "profile.kyc": "KYC Verification",
    "profile.paymentMethods": "Payment Methods",
    "profile.addCard": "Add Card",
    "profile.addBank": "Add Bank Account",
    
    "auth.login": "Login",
    "auth.signup": "Sign Up",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.fullName": "Full Name",
    "auth.dateOfBirth": "Date of Birth",
    "auth.address": "Address",
  },
  es: {
    "app.title": "CryptoBank",
    "common.loading": "Cargando...",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.logout": "Salir",
    "common.language": "Idioma",
    
    "nav.home": "Inicio",
    "nav.trading": "Trading",
    "nav.profile": "Perfil",
    "nav.admin": "Admin",
    
    "dashboard.totalBalance": "Saldo Total",
    "dashboard.deposit": "Depositar",
    "dashboard.withdraw": "Retirar",
    "dashboard.buy": "Comprar",
    "dashboard.swap": "Intercambiar",
    "dashboard.cryptoWallet": "Cartera Crypto",
    "dashboard.fiatAccounts": "Cuentas Fiat",
    "dashboard.recentTransactions": "Transacciones Recientes",
    
    "trading.title": "Trading & Exchange",
    "trading.search": "Buscar activos...",
    "trading.recommended": "Recomendados",
    "trading.allAssets": "Todos los Activos",
    "trading.invest": "Invertir",
    
    "profile.title": "Mi Perfil",
    "profile.personalInfo": "Información Personal",
    "profile.kyc": "Verificación KYC",
    "profile.paymentMethods": "Métodos de Pago",
    "profile.addCard": "Añadir Tarjeta",
    "profile.addBank": "Añadir Cuenta Bancaria",
    
    "auth.login": "Iniciar Sesión",
    "auth.signup": "Registrarse",
    "auth.email": "Correo",
    "auth.password": "Contraseña",
    "auth.fullName": "Nombre Completo",
    "auth.dateOfBirth": "Fecha de Nacimiento",
    "auth.address": "Dirección",
  },
  fr: {
    "app.title": "CryptoBank",
    "common.loading": "Chargement...",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.logout": "Déconnexion",
    "common.language": "Langue",
    
    "nav.home": "Accueil",
    "nav.trading": "Trading",
    "nav.profile": "Profil",
    "nav.admin": "Admin",
    
    "dashboard.totalBalance": "Solde Total",
    "dashboard.deposit": "Dépôt",
    "dashboard.withdraw": "Retrait",
    "dashboard.buy": "Acheter",
    "dashboard.swap": "Échanger",
    "dashboard.cryptoWallet": "Portefeuille Crypto",
    "dashboard.fiatAccounts": "Comptes Fiat",
    "dashboard.recentTransactions": "Transactions Récentes",
    
    "trading.title": "Trading & Exchange",
    "trading.search": "Rechercher des actifs...",
    "trading.recommended": "Recommandés",
    "trading.allAssets": "Tous les Actifs",
    "trading.invest": "Investir",
    
    "profile.title": "Mon Profil",
    "profile.personalInfo": "Informations Personnelles",
    "profile.kyc": "Vérification KYC",
    "profile.paymentMethods": "Méthodes de Paiement",
    "profile.addCard": "Ajouter une Carte",
    "profile.addBank": "Ajouter un Compte Bancaire",
    
    "auth.login": "Connexion",
    "auth.signup": "S'inscrire",
    "auth.email": "Email",
    "auth.password": "Mot de passe",
    "auth.fullName": "Nom Complet",
    "auth.dateOfBirth": "Date de Naissance",
    "auth.address": "Adresse",
  },
  de: {
    "app.title": "CryptoBank",
    "common.loading": "Laden...",
    "common.save": "Speichern",
    "common.cancel": "Abbrechen",
    "common.logout": "Abmelden",
    "common.language": "Sprache",
    
    "nav.home": "Startseite",
    "nav.trading": "Trading",
    "nav.profile": "Profil",
    "nav.admin": "Admin",
    
    "dashboard.totalBalance": "Gesamtsaldo",
    "dashboard.deposit": "Einzahlen",
    "dashboard.withdraw": "Abheben",
    "dashboard.buy": "Kaufen",
    "dashboard.swap": "Tauschen",
    "dashboard.cryptoWallet": "Krypto-Wallet",
    "dashboard.fiatAccounts": "Fiat-Konten",
    "dashboard.recentTransactions": "Letzte Transaktionen",
    
    "trading.title": "Trading & Exchange",
    "trading.search": "Assets suchen...",
    "trading.recommended": "Empfohlen",
    "trading.allAssets": "Alle Assets",
    "trading.invest": "Investieren",
    
    "profile.title": "Mein Profil",
    "profile.personalInfo": "Persönliche Informationen",
    "profile.kyc": "KYC-Verifizierung",
    "profile.paymentMethods": "Zahlungsmethoden",
    "profile.addCard": "Karte hinzufügen",
    "profile.addBank": "Bankkonto hinzufügen",
    
    "auth.login": "Anmelden",
    "auth.signup": "Registrieren",
    "auth.email": "E-Mail",
    "auth.password": "Passwort",
    "auth.fullName": "Vollständiger Name",
    "auth.dateOfBirth": "Geburtsdatum",
    "auth.address": "Adresse",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("it");

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
