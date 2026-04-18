// Back to Top Button Logic
document.addEventListener("DOMContentLoaded", function() {
    // Create the button element
    const backToTopBtn = document.createElement("button");
    backToTopBtn.innerHTML = "&#8679;"; // Up arrow HTML entity
    backToTopBtn.setAttribute("id", "back-to-top");
    backToTopBtn.setAttribute("aria-label", "Back to top");
    document.body.appendChild(backToTopBtn);

    // Show or hide the button based on scroll position
    window.addEventListener("scroll", function() {
        if (window.scrollY > 200) {
            backToTopBtn.classList.add("visible");
        } else {
            backToTopBtn.classList.remove("visible");
        }
    });

    // Smooth scroll to top when clicked
    backToTopBtn.addEventListener("click", function() {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
});
