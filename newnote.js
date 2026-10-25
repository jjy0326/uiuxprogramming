
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#newNoteForm");
    const titleInput = document.querySelector("#noteTitle");
    const subjectInput = document.querySelector("#noteSubject");
    const sectionsContainer = document.querySelector("#noteSections");
    const addButton = document.querySelector("#addSectionButton");
    const message = document.querySelector("#newNoteMessage");

    const STORAGE_KEY = "dailyNotes";

    function getSavedNotes() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(saved) ? saved : [];
        } catch (error) {
            return [];
        }
    }

    function updateSectionNumbers() {
        const items = sectionsContainer.querySelectorAll(".note-section-item");

        items.forEach((item, index) => {
            item.querySelector(".section-number").textContent =
                `${index + 1}. 항목`;

            item.querySelector(".section-title").setAttribute(
                "aria-label",
                `${index + 1}번 항목 제목`
            );

            item.querySelector(".section-content").setAttribute(
                "aria-label",
                `${index + 1}번 항목 내용`
            );
        });

        const deleteButtons = sectionsContainer.querySelectorAll(
            ".delete-section-button"
        );

        deleteButtons.forEach((button) => {
            button.disabled = deleteButtons.length === 1;
        });
    }

    function createSection(title = "", content = "") {
        const article = document.createElement("article");
        article.className = "note-section-item";

        const header = document.createElement("div");
        header.className = "note-section-item-header";

        const heading = document.createElement("h3");
        heading.className = "section-number";
        heading.textContent = "항목";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-section-button";
        deleteButton.textContent = "항목 삭제";

        deleteButton.addEventListener("click", () => {
            if (
                sectionsContainer.querySelectorAll(".note-section-item").length <= 1
            ) {
                message.textContent = "항목은 최소 1개가 필요합니다.";
                return;
            }

            article.remove();
            updateSectionNumbers();
            message.textContent = "항목을 삭제했습니다.";
        });

        header.append(heading, deleteButton);

        const titleGroup = document.createElement("div");
        titleGroup.className = "form-group";

        const titleLabel = document.createElement("label");
        titleLabel.className = "section-title-label";
        titleLabel.textContent = "항목 제목";

        const titleField = document.createElement("input");
        titleField.type = "text";
        titleField.className = "section-title";
        titleField.maxLength = 80;
        titleField.placeholder = "예: 중요 수업 내용";
        titleField.required = true;
        titleField.value = title;

        titleGroup.append(titleLabel, titleField);

        const contentGroup = document.createElement("div");
        contentGroup.className = "form-group";

        const contentLabel = document.createElement("label");
        contentLabel.className = "section-content-label";
        contentLabel.textContent = "항목 내용";

        const contentField = document.createElement("textarea");
contentField.className = "section-content";
contentField.rows = 3;
contentField.maxLength = 1000;
contentField.placeholder = "핵심 내용만 간단하게 작성하세요.";
contentField.required = true;
contentField.value = content;

        contentGroup.append(contentLabel, contentField);
        article.append(header, titleGroup, contentGroup);
        sectionsContainer.appendChild(article);

        updateSectionNumbers();
    }

    function readSections() {
        return Array.from(
            sectionsContainer.querySelectorAll(".note-section-item")
        ).map((item, index) => ({
            order: index + 1,
            title: item.querySelector(".section-title").value.trim(),
            content: item.querySelector(".section-content").value.trim()
        }));
    }

    addButton.addEventListener("click", () => {
        const count = sectionsContainer.querySelectorAll(
            ".note-section-item"
        ).length;

        if (count >= 30) {
            message.textContent = "항목은 최대 30개까지 추가할 수 있습니다.";
            return;
        }

        createSection();
        message.textContent = "새 항목을 추가했습니다.";

        const items = sectionsContainer.querySelectorAll(".note-section-item");
        items[items.length - 1].querySelector(".section-title").focus();
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const title = titleInput.value.trim();
        const subject = subjectInput.value.trim();
        const sections = readSections();

        if (!title) {
            message.textContent = "노트 제목을 입력하세요.";
            titleInput.focus();
            return;
        }

        if (
            sections.length === 0 ||
            sections.some((section) => !section.title || !section.content)
        ) {
            message.textContent = "모든 항목의 제목과 내용을 입력하세요.";
            return;
        }

        const notes = getSavedNotes();


        notes.unshift(newNote);

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
            message.textContent = "노트를 저장했습니다. 메인 페이지에서 확인하세요.";

            if (confirm("노트를 저장했습니다. 메인 페이지로 이동할까요?")) {
                window.location.href = "index.html";
            }
        } catch (error) {
            message.textContent =
                "저장하지 못했습니다. 브라우저 저장 공간을 확인하세요.";
        }
    });

    form.addEventListener("reset", () => {
        window.setTimeout(() => {
            sectionsContainer.innerHTML = "";
            createSection();
            message.textContent = "";
        }, 0);
    });

    updateSectionNumbers();
});

const previewButton = document.querySelector("#previewButton");

previewButton.addEventListener("click", () => {
    const title = titleInput.value.trim();
    const subject = subjectInput.value.trim();
    const sections = readSections();

    if (!title) {
        message.textContent = "노트 제목을 입력하세요.";
        titleInput.focus();
        return;
    }

    if (sections.some(section => !section.title || !section.content)) {
        message.textContent = "항목 제목과 내용을 입력하세요.";
        return;
    }

    const previewWindow = window.open("", "_blank");

    if (!previewWindow) {
        message.textContent = "미리보기 창이 차단되었습니다. 팝업을 허용해 주세요.";
        return;
    }

    const previewTitle = document.createElement("h1");
    previewTitle.textContent = title;
    previewWindow.document.body.appendChild(previewTitle);

    if (subject) {
        const subjectText = document.createElement("p");
        subjectText.textContent = `수업 주제: ${subject}`;
        previewWindow.document.body.appendChild(subjectText);
    }

    sections.forEach((section, index) => {
        const heading = document.createElement("h2");
        heading.textContent = `${index + 1}. ${section.title}`;

        const content = document.createElement("p");
        content.textContent = section.content;

        previewWindow.document.body.append(heading, content);
    });

    previewWindow.document.body.style.cssText =
        "font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.7;";
});
