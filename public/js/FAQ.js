const faqQuestions = document.querySelectorAll(".faq-question");

faqQuestions.forEach((question) => {
    question.addEventListener("click", () => {
        const answer = question.nextElementSibling;
        const isOpen = answer.classList.contains("open");

        // Close all
        document.querySelectorAll(".faq-answer").forEach(a => {
            a.classList.remove("open");
        });
        document.querySelectorAll(".faq-question").forEach(q => {
            q.classList.remove("active");
        });

        // Toggle clicked
        if (!isOpen) {
            answer.classList.add("open");
            question.classList.add("active");
        }
    });
});
