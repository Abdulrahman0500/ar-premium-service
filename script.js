document.documentElement.classList.add("js-enabled");

const menuToggle = document.querySelector(".menu-toggle");
const primaryNavigation = document.querySelector("#primary-navigation");
const enquiryForm = document.querySelector("#enquiry-form");
const formStatus = document.querySelector("#form-status");

// Business WhatsApp number in international format, digits only.
const WHATSAPP_PHONE = "2348131674549";

function closeNavigation() {
  if (!menuToggle || !primaryNavigation) return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  primaryNavigation.classList.remove("is-open");
}

if (menuToggle && primaryNavigation) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
    primaryNavigation.classList.toggle("is-open", !isOpen);
  });

  primaryNavigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) closeNavigation();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && primaryNavigation.classList.contains("is-open")) {
      closeNavigation();
      menuToggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      primaryNavigation.classList.contains("is-open") &&
      event.target instanceof Node &&
      !primaryNavigation.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeNavigation();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) closeNavigation();
  });
}

const yearElement = document.querySelector("#current-year");
if (yearElement) yearElement.textContent = String(new Date().getFullYear());

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

document.querySelectorAll("[data-service]").forEach((link) => {
  link.addEventListener("click", () => {
    const serviceField = document.querySelector("#service");
    if (serviceField instanceof HTMLSelectElement) {
      const requestedService = link.getAttribute("data-service");
      const matchingOption = Array.from(serviceField.options).find((option) => option.textContent === requestedService);
      if (matchingOption) serviceField.value = matchingOption.value;
    }
  });
});

function setFormMessage(message, type) {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.classList.remove("is-success", "is-info");
  if (type) formStatus.classList.add(`is-${type}`);
}

function clearInvalidState(field) {
  field.removeAttribute("aria-invalid");
  field.setCustomValidity("");
}

function createWhatsAppUrl(phoneNumber, message) {
  const digits = phoneNumber.replace(/\D/g, "");
  if (!/^\d{8,15}$/.test(digits)) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

if (enquiryForm instanceof HTMLFormElement) {
  const fields = Array.from(enquiryForm.querySelectorAll("input, select, textarea"));
  fields.forEach((field) => {
    field.addEventListener("input", () => {
      clearInvalidState(field);
      setFormMessage("", "");
    });
    field.addEventListener("change", () => {
      clearInvalidState(field);
      setFormMessage("", "");
    });
  });

  enquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    setFormMessage("", "");
    fields.forEach(clearInvalidState);

    const nameField = enquiryForm.elements.namedItem("name");
    const phoneField = enquiryForm.elements.namedItem("phone");
    const serviceField = enquiryForm.elements.namedItem("service");
    const messageField = enquiryForm.elements.namedItem("message");

    if (
      !(nameField instanceof HTMLInputElement) ||
      !(phoneField instanceof HTMLInputElement) ||
      !(serviceField instanceof HTMLSelectElement) ||
      !(messageField instanceof HTMLTextAreaElement)
    ) {
      setFormMessage("The enquiry form could not be submitted. Please refresh the page and try again.", "");
      return;
    }

    const name = nameField.value.trim();
    const phone = phoneField.value.trim();
    const message = messageField.value.trim();
    let firstInvalidField = null;

    if (name.length < 2) {
      nameField.setCustomValidity("Please enter your name.");
      firstInvalidField = nameField;
    } else {
      const phoneDigits = phone.replace(/\D/g, "");
      const isPhone = /^[+]?\d[\d\s().-]*$/.test(phone) && phoneDigits.length >= 7 && phoneDigits.length <= 15;
      if (!isPhone) {
        phoneField.setCustomValidity("Please enter a valid phone number, including your country code.");
        firstInvalidField = phoneField;
      }
    }

    if (!firstInvalidField && !serviceField.value) {
      serviceField.setCustomValidity("Please choose a service.");
      firstInvalidField = serviceField;
    }

    if (!firstInvalidField && message.length < 10) {
      messageField.setCustomValidity("Please add a few more details (at least 10 characters).");
      firstInvalidField = messageField;
    }

    if (firstInvalidField) {
      firstInvalidField.setAttribute("aria-invalid", "true");
      firstInvalidField.reportValidity();
      setFormMessage("Please check the highlighted field and try again.", "");
      return;
    }

    const enquiry = [
      "Hello AR Premium Service,",
      "",
      "I'd like to enquire about: " + serviceField.value,
      "",
      "Name: " + name,
      "Phone: " + phone,
      "",
      "Message:",
      message
    ].join("\n");
    const whatsappUrl = createWhatsAppUrl(WHATSAPP_PHONE, enquiry);
    if (!whatsappUrl) {
      setFormMessage("WhatsApp enquiries could not be prepared. Please contact us using the WhatsApp button.", "info");
      return;
    }

    const whatsappWindow = window.open(whatsappUrl, "_blank");

    if (whatsappWindow) {
      whatsappWindow.opener = null;
      setFormMessage("Your enquiry is ready in WhatsApp. Review it there and send when you're ready.", "success");
    } else {
      setFormMessage("Your browser blocked the WhatsApp window. Please allow pop-ups and submit again.", "");
    }
  });
}