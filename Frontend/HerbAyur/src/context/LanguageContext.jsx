import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { uiTextTranslations } from "../i18n/uiTranslations";

const languageOptions = [
  { code: "en", label: "English", shortLabel: "EN" },
  { code: "si", label: "සිංහල", shortLabel: "සිං" },
  { code: "ta", label: "தமிழ்", shortLabel: "தமிழ்" },
];

const translations = {
  en: {
    navHome: "Home",
    navAbout: "About",
    navContact: "Contact",
    postRequirement: "Post Requirement",
    login: "Login",
    signup: "Sign Up",
    myProfile: "My Profile",
    dashboard: "Dashboard",
    logout: "Logout",
    language: "Language",
  },
  si: {
    navHome: "මුල් පිටුව",
    navAbout: "අප ගැන",
    navContact: "සම්බන්ධ වන්න",
    postRequirement: "අවශ්‍යතාව පළ කරන්න",
    login: "ඇතුළු වන්න",
    signup: "ලියාපදිංචි වන්න",
    myProfile: "මගේ පැතිකඩ",
    dashboard: "පාලක පුවරුව",
    logout: "පිටවීම",
    language: "භාෂාව",
  },
  ta: {
    navHome: "முகப்பு",
    navAbout: "எங்களை பற்றி",
    navContact: "தொடர்பு",
    postRequirement: "தேவையை பதிவிடு",
    login: "உள்நுழை",
    signup: "பதிவு செய்",
    myProfile: "என் சுயவிவரம்",
    dashboard: "கட்டுப்பாட்டு பலகம்",
    logout: "வெளியேறு",
    language: "மொழி",
  },
};

const LanguageContext = createContext(null);
const originalTextNodes = new WeakMap();
const translatedTextNodes = new WeakMap();
const translatableAttributes = ["placeholder", "title", "aria-label", "value"];

function getReverseTranslations() {
  return Object.values(uiTextTranslations).reduce((reverse, dictionary) => {
    Object.entries(dictionary).forEach(([english, translated]) => {
      reverse[translated] = english;
    });
    return reverse;
  }, {});
}

const reverseTranslations = getReverseTranslations();

function splitOuterWhitespace(text) {
  const match = text.match(/^(\s*)(.*?)(\s*)$/s);
  return {
    before: match?.[1] || "",
    core: match?.[2] || text,
    after: match?.[3] || "",
  };
}

function translateText(text, language) {
  const { before, core, after } = splitOuterWhitespace(text);
  const normalized = reverseTranslations[core.replace(/\s+/g, " ").trim()] || core.replace(/\s+/g, " ").trim();

  if (language === "en" || !text?.trim()) return `${before}${normalized}${after}`;

  const dictionary = uiTextTranslations[language];
  if (!dictionary) return `${before}${normalized}${after}`;

  const direct = dictionary[normalized];

  if (direct) return `${before}${direct}${after}`;

  let translated = core;
  const phrases = Object.keys(dictionary).sort((a, b) => b.length - a.length);
  phrases.forEach((phrase) => {
    translated = translated.split(phrase).join(dictionary[phrase]);
  });

  return `${before}${translated}${after}`;
}

function shouldSkipElement(element) {
  return (
    ["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"].includes(element.tagName) ||
    Boolean(element.closest("[data-i18n-skip]"))
  );
}

function translateElementAttributes(element, language) {
  translatableAttributes.forEach((attribute) => {
    if (!element.hasAttribute(attribute)) return;

    const originalAttribute = `data-i18n-original-${attribute}`;
    if (!element.hasAttribute(originalAttribute)) {
      element.setAttribute(originalAttribute, element.getAttribute(attribute));
    }

    const original = element.getAttribute(originalAttribute);
    const translated = translateText(original, language);

    if (element.getAttribute(attribute) !== translated) {
      element.setAttribute(attribute, translated);
    }
  });
}

function applyUiLanguage(language) {
  const root = document.body;
  if (!root) return;

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || shouldSkipElement(parent) || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach((node) => {
    const lastTranslated = translatedTextNodes.get(node);
    const original =
      lastTranslated && node.nodeValue === lastTranslated
        ? originalTextNodes.get(node)
        : node.nodeValue;

    originalTextNodes.set(node, original);
    const translated = translateText(original, language);

    if (node.nodeValue !== translated) {
      node.nodeValue = translated;
    }

    translatedTextNodes.set(node, translated);
  });

  root.querySelectorAll("[placeholder], [title], [aria-label], input[type='button'], input[type='submit']").forEach((element) => {
    translateElementAttributes(element, language);
  });
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(
    () => localStorage.getItem("language") || "en"
  );

  useEffect(() => {
    document.documentElement.lang = language;
    window.setTimeout(() => applyUiLanguage(language), 0);

    const observer = new MutationObserver(() => {
      window.setTimeout(() => applyUiLanguage(language), 0);
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(() => {
    const setLanguage = (nextLanguage) => {
      setLanguageState(nextLanguage);
      localStorage.setItem("language", nextLanguage);
      document.documentElement.lang = nextLanguage;
    };

    const t = (key) => translations[language]?.[key] || translations.en[key] || key;

    return {
      language,
      languageOptions,
      setLanguage,
      t,
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
