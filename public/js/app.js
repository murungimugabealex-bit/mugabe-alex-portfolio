/* ============================================================
   Murungi Alex Mugabe — Portfolio
   Behaviour: mobile nav, active-section highlighting, contact form.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Site config ---------- */
  var CONFIG = {
    // Where the contact form is handled (Cloudflare Pages Function).
    endpoint: "/api/contact",
    // International format, no + or spaces.
    whatsapp: "256770159605"
  };

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Mobile nav ---------- */
  var navToggle = document.getElementById("nav-toggle");
  var primaryNav = document.getElementById("primary-nav");

  if (navToggle && primaryNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = primaryNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Toggle navigation");
    });

    // Close the menu when a link is chosen (small screens).
    primaryNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        primaryNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Toggle navigation");
      }
    });

    // Close the menu with Escape.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && primaryNav.classList.contains("open")) {
        primaryNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Toggle navigation");
        navToggle.focus();
      }
    });
  }

  /* ---------- Active nav link (scroll spy) ---------- */
  var sections = Array.prototype.slice.call(
    document.querySelectorAll("main section[id]")
  );
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll(".primary-nav a[href^='#']")
  );

  function setActiveLink(id) {
    navLinks.forEach(function (link) {
      var target = link.getAttribute("href").slice(1);
      if (target === id) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  // Use IntersectionObserver when available for a smooth scroll-spy.
  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActiveLink(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById("contact-form");
  if (form) {
    var fields = {
      name: document.getElementById("name"),
      email: document.getElementById("email"),
      message: document.getElementById("message")
    };
    var errors = {
      name: document.getElementById("name-error"),
      email: document.getElementById("email-error"),
      message: document.getElementById("message-error")
    };
    var statusEl = document.getElementById("form-status");
    var submitBtn = document.getElementById("form-submit");
    var honeypot = document.getElementById("company");
    var submitLabel = submitBtn ? submitBtn.textContent : "Send message";

    function clearStatus() {
      if (statusEl) {
        statusEl.textContent = "";
        statusEl.className = "form-status";
      }
    }

    function setFieldError(name, message) {
      if (errors[name]) errors[name].textContent = message;
      if (fields[name]) fields[name].setAttribute("aria-invalid", message ? "true" : "false");
    }

    function validateName(value) {
      var v = value.trim();
      if (!v) return "Please tell me your name.";
      if (v.length < 2) return "Your name looks a little short.";
      return "";
    }

    function validateEmail(value) {
      var v = value.trim();
      if (!v) return "I'll need your email to reply.";
      var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(v)) return "That email doesn't look valid.";
      return "";
    }

    function validateMessage(value) {
      var v = value.trim();
      if (!v) return "Don't forget to write your message.";
      if (v.length < 10) return "A few more words so I know what it's about.";
      return "";
    }

    // Live validation after the visitor has touched a field.
    ["name", "email", "message"].forEach(function (key) {
      fields[key].addEventListener("blur", function () {
        var msg = key === "name"   ? validateName(fields.name.value)
                : key === "email"  ? validateEmail(fields.email.value)
                : validateMessage(fields.message.value);
        setFieldError(key, msg);
      });
      fields[key].addEventListener("input", clearStatus);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearStatus();

      var nameErr = validateName(fields.name.value);
      var emailErr = validateEmail(fields.email.value);
      var msgErr = validateMessage(fields.message.value);
      setFieldError("name", nameErr);
      setFieldError("email", emailErr);
      setFieldError("message", msgErr);

      if (nameErr || emailErr || msgErr) {
        if (statusEl) {
          statusEl.textContent = "Almost there — please fix the highlighted fields.";
          statusEl.className = "form-status error";
        }
        return;
      }

      var name = fields.name.value.trim();
      var email = fields.email.value.trim();
      var message = fields.message.value.trim();

      function setSending(isSending) {
        if (!submitBtn) return;
        submitBtn.disabled = isSending;
        submitBtn.textContent = isSending ? "Sending…" : submitLabel;
        submitBtn.setAttribute("aria-busy", String(isSending));
      }

      setSending(true);

      fetch(CONFIG.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          email: email,
          message: message,
          company: honeypot ? honeypot.value : ""
        })
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (!res.ok) throw new Error(data.error || "Something went wrong.");
            return data;
          });
        })
        .then(function () {
          form.reset();
          Object.keys(fields).forEach(function (k) {
            fields[k].removeAttribute("aria-invalid");
            setFieldError(k, "");
          });
          if (statusEl) {
            statusEl.textContent = "Thanks " + name.split(" ")[0] + " — your message is on its way. I'll get back to you soon.";
            statusEl.className = "form-status success";
          }
        })
        .catch(function (err) {
          if (statusEl) {
            var waBody = encodeURIComponent(
              "Hi Alex, my name is " + name + ".\n\n" + message + "\n\nMy email: " + email
            );
            statusEl.textContent = (err && err.message ? err.message + " " : "") + "You can also message me on WhatsApp.";
            statusEl.className = "form-status error";
            var waLink = document.createElement("a");
            waLink.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + waBody;
            waLink.target = "_blank";
            waLink.rel = "noopener";
            waLink.textContent = "Open WhatsApp";
            statusEl.appendChild(document.createTextNode(" "));
            statusEl.appendChild(waLink);
          }
        })
        .then(function () {
          setSending(false);
        });
    });
  }
})();