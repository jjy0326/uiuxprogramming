"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#newNoteForm");
    if (!form) return;

    const titleInput = document.querySelector("#noteTitle");
    const subjectSelect = document.querySelector("#noteSubject");
    const customSubjectGroup = document.querySelector("#customSubjectGroup");
    const customSubjectInput = document.querySelector("#customSubject");
    const sectionsContainer = document.querySelector("#noteSections");
    const addButton = document.querySelector("#addSectionButton");
    const previewButton = document.querySelector("#previewButton");
    const saveButton = document.querySelector("#newNoteSaveButton");
    const message = document.querySelector("#newNoteMessage");
    const STORAGE_KEY = "dailyNotes";

    let sectionSequence = 1;
    let isSubmitting = false;
    let isProgrammaticReset = false;

    function showMessage(text, type = "") {
        message.textContent = text;
        message.classList.remove("is-saved", "is-error", "is-progress");
        if (type) message.classList.add(type);
    }

    function readSavedNotes() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            throw new Error("저장된 노트 데이터 형식이 올바르지 않습니다.");
        }
        return parsed;
    }

    function setFieldState(input, feedback, text = "") {
        if (!input || !feedback) return;

        feedback.textContent = text;
        input.setAttribute("aria-invalid", text ? "true" : "false");
        feedback.classList.toggle("is-error", Boolean(text));
    }

    function updateCounter(input, counter) {
        if (input && counter) {
            counter.textContent = `${input.value.length}/${input.maxLength}자`;
        }
    }

    function updateSubjectArea() {
        const isOther = subjectSelect.value === "기타";
        customSubjectGroup.hidden = !isOther;
        customSubjectInput.disabled = !isOther;
        customSubjectInput.required = isOther;

        if (!isOther) {
            customSubjectInput.value = "";
            setFieldState(
                customSubjectInput,
                document.querySelector("#customSubjectError"),
                ""
            );
        }
    }

    function createSection(title = "", content = "") {
        sectionSequence += 1;
        const idNumber = sectionSequence;

        const article = document.createElement("article");
        article.className = "note-section-item";

        const header = document.createElement("div");
        header.className = "note-section-item-header";

        const heading = document.createElement("h3");
        heading.className = "section-number";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-section-button";
        deleteButton.textContent = "항목 삭제";

        deleteButton.addEventListener("click", () => {
            const itemCount = sectionsContainer.querySelectorAll(".note-section-item").length;
            if (itemCount <= 1) {
                showMessage("학습 항목은 최소 1개가 필요합니다.", "is-error");
                return;
            }
            article.remove();
            updateSectionNumbers();
            showMessage("항목을 삭제했습니다.", "is-saved");
        });

        header.append(heading, deleteButton);

        const titleGroup = document.createElement("div");
        titleGroup.className = "form-group";

        const titleId = `sectionTitle${idNumber}`;
        const titleLabel = document.createElement("label");
        titleLabel.htmlFor = titleId;
        titleLabel.className = "section-title-label";
        titleLabel.textContent = "항목 제목 *";

        const titleField = document.createElement("input");
        titleField.type = "text";
        titleField.id = titleId;
        titleField.className = "section-title";
        titleField.minLength = 2;
        titleField.maxLength = 80;
        titleField.placeholder = "예: 중요 수업 내용";
        titleField.required = true;
        titleField.value = title;

        const titleHelp = document.createElement("small");
        titleHelp.className = "field-help";
        titleHelp.textContent = "2~80자로 입력해 주세요.";

        const titleCount = document.createElement("small");
        titleCount.className = "field-count section-title-count";
        titleCount.textContent = `${title.length}/80자`;

        const titleError = document.createElement("p");
        titleError.className = "field-feedback section-title-error";
        titleError.setAttribute("aria-live", "polite");

        titleGroup.append(titleLabel, titleField, titleHelp, titleCount, titleError);

        const contentGroup = document.createElement("div");
        contentGroup.className = "form-group";

        const contentId = `sectionContent${idNumber}`;
        const contentLabel = document.createElement("label");
        contentLabel.htmlFor = contentId;
        contentLabel.className = "section-content-label";
        contentLabel.textContent = "간단한 내용 *";

        const contentField = document.createElement("textarea");
        contentField.id = contentId;
        contentField.className = "section-content";
        contentField.rows = 3;
        contentField.minLength = 10;
        contentField.maxLength = 1000;
        contentField.placeholder = "핵심 내용만 간단하게 작성하세요.";
        contentField.required = true;
        contentField.value = content;

        const contentHelp = document.createElement("small");
        contentHelp.className = "field-help";
        contentHelp.textContent = "10~1,000자로 입력해 주세요.";

        const contentCount = document.createElement("small");
        contentCount.className = "field-count section-content-count";
        contentCount.textContent = `${content.length}/1,000자`;

        const contentError = document.createElement("p");
        contentError.className = "field-feedback section-content-error";
        contentError.setAttribute("aria-live", "polite");

        contentGroup.append(contentLabel, contentField, contentHelp, contentCount, contentError);
        article.append(header, titleGroup, contentGroup);
        sectionsContainer.appendChild(article);

        titleField.addEventListener("input", () => {
            updateCounter(titleField, titleCount);
            setFieldState(titleField, titleError, "");
        });

        contentField.addEventListener("input", () => {
            updateCounter(contentField, contentCount);
            setFieldState(contentField, contentError, "");
        });

        updateSectionNumbers();
        return article;
    }

    function updateSectionNumbers() {
        const items = sectionsContainer.querySelectorAll(".note-section-item");

        items.forEach((item, index) => {
            const heading = item.querySelector(".section-number");
            const titleField = item.querySelector(".section-title");
            const contentField = item.querySelector(".section-content");
            const titleLabel = item.querySelector(".section-title-label");
            const contentLabel = item.querySelector(".section-content-label");
            const deleteButton = item.querySelector(".delete-section-button");

            heading.textContent = `${index + 1}. 항목`;
            titleField.setAttribute("aria-label", `${index + 1}번 항목 제목`);
            contentField.setAttribute("aria-label", `${index + 1}번 항목 내용`);
            titleLabel.htmlFor = titleField.id;
            contentLabel.htmlFor = contentField.id;
            deleteButton.disabled = items.length === 1;
        });
    }

    function getSections() {
        return Array.from(sectionsContainer.querySelectorAll(".note-section-item")).map((item) => ({
            title: item.querySelector(".section-title").value.trim(),
            content: item.querySelector(".section-content").value.trim()
        }));
    }

    function validateForm() {
        let firstInvalid = null;
        let valid = true;

        const title = titleInput.value.trim();
        const titleError = document.querySelector("#noteTitleError");
        const titleCount = document.querySelector("#noteTitleCount");
        updateCounter(titleInput, titleCount);

        let titleMessage = "";
        if (!title) titleMessage = "노트 제목을 입력해 주세요.";
        else if (title.length < 2) titleMessage = "제목은 2자 이상 입력해 주세요.";
        setFieldState(titleInput, titleError, titleMessage);

        if (titleMessage) {
            valid = false;
            firstInvalid = firstInvalid || titleInput;
        }

        const subjectError = document.querySelector("#noteSubjectError");
        const subjectMessage = subjectSelect.value ? "" : "수업 주제를 선택해 주세요.";
        setFieldState(subjectSelect, subjectError, subjectMessage);

        if (subjectMessage) {
            valid = false;
            firstInvalid = firstInvalid || subjectSelect;
        }

        if (subjectSelect.value === "기타") {
            const customError = document.querySelector("#customSubjectError");
            const customValue = customSubjectInput.value.trim();
            let customMessage = "";

            if (!customValue) customMessage = "수업 주제를 직접 입력해 주세요.";
            else if (customValue.length < 2) customMessage = "주제는 2자 이상 입력해 주세요.";

            setFieldState(customSubjectInput, customError, customMessage);

            if (customMessage) {
                valid = false;
                firstInvalid = firstInvalid || customSubjectInput;
            }
        }

        const sectionItems = sectionsContainer.querySelectorAll(".note-section-item");

        sectionItems.forEach((item) => {
            const sectionTitle = item.querySelector(".section-title");
            const sectionContent = item.querySelector(".section-content");
            const titleFeedback = item.querySelector(".section-title-error");
            const contentFeedback = item.querySelector(".section-content-error");
            const titleCounter = item.querySelector(".section-title-count");
            const contentCounter = item.querySelector(".section-content-count");

            updateCounter(sectionTitle, titleCounter);
            updateCounter(sectionContent, contentCounter);

            const sectionTitleValue = sectionTitle.value.trim();
            const sectionContentValue = sectionContent.value.trim();

            let sectionTitleMessage = "";
            let sectionContentMessage = "";

            if (!sectionTitleValue) sectionTitleMessage = "항목 제목을 입력해 주세요.";
            else if (sectionTitleValue.length < 2) sectionTitleMessage = "항목 제목은 2자 이상 입력해 주세요.";

            if (!sectionContentValue) sectionContentMessage = "항목 내용을 입력해 주세요.";
            else if (sectionContentValue.length < 10) sectionContentMessage = "내용은 10자 이상 입력해 주세요.";

            setFieldState(sectionTitle, titleFeedback, sectionTitleMessage);
            setFieldState(sectionContent, contentFeedback, sectionContentMessage);

            if (sectionTitleMessage) {
                valid = false;
                firstInvalid = firstInvalid || sectionTitle;
            }

            if (sectionContentMessage) {
                valid = false;
                firstInvalid = firstInvalid || sectionContent;
            }
        });

        if (!valid) {
            showMessage("입력 조건을 확인해 주세요. 오류가 표시된 항목을 수정하면 됩니다.", "is-error");
            firstInvalid?.focus();
        }

        return valid;
    }

    function clearValidation() {
        form.querySelectorAll(".field-feedback").forEach((element) => {
            element.textContent = "";
            element.classList.remove("is-error");
        });

        form.querySelectorAll("[aria-invalid='true']").forEach((element) => {
            element.setAttribute("aria-invalid", "false");
        });
    }

    function resetSections() {
        sectionsContainer.replaceChildren();
        sectionSequence = 0;
        createSection();
    }

    function handlePreview() {
        if (!validateForm()) return;

        const preview = window.open("", "_blank");
        if (!preview) {
            showMessage("미리보기 창이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요.", "is-error");
            return;
        }

        const title = titleInput.value.trim();
        const subject = subjectSelect.value === "기타"
            ? customSubjectInput.value.trim()
            : subjectSelect.value;

        preview.document.open();
        preview.document.write(
            "<!DOCTYPE html><html lang='ko'><head><meta charset='UTF-8'><title>노트 미리보기</title></head><body></body></html>"
        );
        preview.document.close();

        preview.document.body.style.cssText =
            "font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.7;";

        const heading = preview.document.createElement("h1");
        heading.textContent = title;

        const subjectText = preview.document.createElement("p");
        subjectText.textContent = `수업 주제: ${subject}`;

        preview.document.body.append(heading, subjectText);

        getSections().forEach((section, index) => {
            const sectionHeading = preview.document.createElement("h2");
            sectionHeading.textContent = `${index + 1}. ${section.title}`;

            const sectionContent = preview.document.createElement("p");
            sectionContent.textContent = section.content;

            preview.document.body.append(sectionHeading, sectionContent);
        });

        showMessage("입력한 내용을 미리보기로 확인했습니다.", "is-saved");
    }

    function saveNote() {
        if (isSubmitting || !validateForm()) return;

        isSubmitting = true;
        saveButton.disabled = true;
        saveButton.textContent = "저장 중...";
        showMessage("노트를 저장하고 있습니다. 잠시만 기다려 주세요.", "is-progress");

        window.setTimeout(() => {
            try {
                const notes = readSavedNotes();
                const subject = subjectSelect.value === "기타"
                    ? customSubjectInput.value.trim()
                    : subjectSelect.value;

                const newNote = {
                    id: (typeof crypto !== "undefined" && crypto.randomUUID)
                        ? crypto.randomUUID()
                        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    title: titleInput.value.trim(),
                    subject,
                    sections: getSections(),
                    date: new Date().toLocaleString("ko-KR")
                };

                notes.unshift(newNote);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));

                showMessage("노트 저장이 완료되었습니다. 메인 페이지의 저장된 노트에서 확인할 수 있습니다.", "is-saved");
                isProgrammaticReset = true;
                form.reset();
                isProgrammaticReset = false;
                updateSubjectArea();
                resetSections();
                clearValidation();
            } catch (error) {
                console.error("노트 저장 실패:", error);
                showMessage("저장에 실패했습니다. 입력 내용은 유지했으니 브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.", "is-error");
            } finally {
                isSubmitting = false;
                saveButton.disabled = false;
                saveButton.textContent = "노트 저장";
            }
        }, 350);
    }

    addButton.addEventListener("click", () => {
        const count = sectionsContainer.querySelectorAll(".note-section-item").length;

        if (count >= 30) {
            showMessage("항목은 최대 30개까지 추가할 수 있습니다.", "is-error");
            return;
        }

        const newSection = createSection();
        newSection.querySelector(".section-title").focus();
        showMessage("새 항목을 추가했습니다.", "is-saved");
    });

    previewButton.addEventListener("click", handlePreview);
    subjectSelect.addEventListener("change", () => {
        updateSubjectArea();
        setFieldState(subjectSelect, document.querySelector("#noteSubjectError"), "");
        showMessage("");
    });

    titleInput.addEventListener("input", () => {
        updateCounter(titleInput, document.querySelector("#noteTitleCount"));
        setFieldState(titleInput, document.querySelector("#noteTitleError"), "");
    });

    customSubjectInput.addEventListener("input", () => {
        setFieldState(customSubjectInput, document.querySelector("#customSubjectError"), "");
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        saveNote();
    });

    form.addEventListener("reset", () => {
        const shouldAnnounceReset = !isProgrammaticReset;
        window.setTimeout(() => {
            updateSubjectArea();
            resetSections();
            clearValidation();
            updateCounter(titleInput, document.querySelector("#noteTitleCount"));
            if (shouldAnnounceReset) {
                showMessage("입력 내용과 안내 문구를 초기화했습니다.", "is-saved");
            }
        }, 0);
    });

    updateSubjectArea();
    updateCounter(titleInput, document.querySelector("#noteTitleCount"));
    updateSectionNumbers();
});
