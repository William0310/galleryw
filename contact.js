document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("[data-contact-form]");

    if (!form) {
        return;
    }

    const submit = form.querySelector("[data-contact-submit]");
    const status = form.querySelector("[data-contact-status]");

    const setState = (state, message) => {
        form.classList.toggle("is-sending", state === "sending");
        form.classList.toggle("is-success", state === "success");
        form.classList.toggle("is-error", state === "error");

        if (submit) {
            submit.disabled = state === "sending";
        }

        if (status) {
            status.textContent = message;
        }
    };

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        setState("sending", "Sending...60%");

        try {
            const response = await window.fetch(form.action, {
                method: "POST",
                body: new FormData(form),
                headers: {
                    Accept: "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Form submission failed.");
            }

            form.reset();
            setState("success", "Message sent. Thank you. Expact a response within 36Hr ");
        } catch {
            setState("error", "Could not send right now. Please email support.wphoto@gmail.com directly.");
        }
    });
});
