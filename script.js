"use strict";

/* 페이지마다 존재하는 요소가 다르므로 요소가 있을 때만 기능을 연결합니다. */
const themeButton = document.querySelector("#themeButton");
const memoInput = document.querySelector("#nickname");
const memoMessage = document.querySelector("#memoMessage");
const studyChecks = document.querySelectorAll(".study-check");
const studyProgress = document.querySelector("#studyProgress");
const studyCompleteButton = document.querySelector("#studyCompleteButton");
const studyCompleteMessage = document.querySelector("#studyCompleteMessage");

const DAILY_NOTES_KEY = "dailyNotes";
const LEGACY_NOTES_KEY = "savedNotes";

function readStorage(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? defaultValue : value;
    } catch (error) {
        console.error("데이터를 불러오지 못했습니다.", error);
        return defaultValue;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.error("데이터 저장에 실패했습니다.", error);
        return false;
    }
}

function showMessage(element, message, type = "") {
    if (!element) return;

    element.textContent = message;
    element.classList.remove("is-saved", "is-error", "is-progress");

    if (type) element.classList.add(type);
}

/* 공통 테마 기능 */
function loadTheme() {
    if (!themeButton) return;

    const savedTheme = readStorage("pageTheme", "light");
    const isDark = savedTheme === "dark";

    document.body.classList.toggle("dark", isDark);
    themeButton.textContent = isDark ? "라이트 테마" : "다크 테마";
}

function handleThemeClick() {
    const isDark = document.body.classList.toggle("dark");

    if (themeButton) {
        themeButton.textContent = isDark ? "라이트 테마" : "다크 테마";
    }

    if (!writeStorage("pageTheme", isDark ? "dark" : "light")) {
        showMessage(memoMessage, "테마는 변경했지만 설정 저장에 실패했습니다.", "is-error");
    }
}

/* 메인 페이지 간단 메모 */
function handleStudyMemoInput() {
    if (!memoInput) return;

    const memo = memoInput.value.trim();

    if (writeStorage("studyMemo", memo)) {
        showMessage(
            memoMessage,
            memo ? "메모가 저장되었습니다." : "메모가 비어 있습니다.",
            memo ? "is-saved" : ""
        );
    } else {
        showMessage(memoMessage, "메모 저장에 실패했습니다.", "is-error");
    }
}

function loadStudyMemo() {
    if (!memoInput) return;

    const savedMemo = readStorage("studyMemo", "");
    memoInput.value = savedMemo || "";

    if (savedMemo) {
        showMessage(memoMessage, "저장된 메모를 불러왔습니다.", "is-saved");
    }
}

/* 메인 페이지 학습 체크리스트 */
function updateStudyProgress() {
    if (!studyProgress) return;

    const checkedCount = Array.from(studyChecks).filter((item) => item.checked).length;
    studyProgress.textContent = `학습 진행률: ${checkedCount}/${studyChecks.length}`;
}

function saveStudyChecks() {
    const checkedValues = Array.from(studyChecks)
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.value);

    if (!writeStorage("studyChecks", JSON.stringify(checkedValues))) {
        showMessage(studyCompleteMessage, "학습 상태 저장에 실패했습니다.", "is-error");
    }

    updateStudyProgress();
}

function loadStudyChecks() {
    if (studyChecks.length === 0) return;

    try {
        const checkedValues = JSON.parse(readStorage("studyChecks", "[]"));

        if (!Array.isArray(checkedValues)) {
            throw new Error("체크리스트 데이터가 올바르지 않습니다.");
        }

        studyChecks.forEach((checkbox) => {
            checkbox.checked = checkedValues.includes(checkbox.value);
        });
    } catch (error) {
        console.error("체크리스트를 불러오지 못했습니다.", error);
    }

    updateStudyProgress();
}

function handleStudyComplete() {
    const checkedCount = Array.from(studyChecks).filter((item) => item.checked).length;

    if (checkedCount === studyChecks.length) {
        showMessage(studyCompleteMessage, "모든 학습 항목을 확인했습니다.", "is-saved");
    } else {
        showMessage(
            studyCompleteMessage,
            `${studyChecks.length - checkedCount}개 항목이 남아 있습니다.`
        );
    }
}

/* 새 노트와 2주차 노트를 메인 페이지에 함께 표시 */
function renderDynamicNotes() {
    const list = document.querySelector("#dynamicNoteList");
    const message = document.querySelector("#dynamicNoteMessage");

    if (!list) return;

    list.replaceChildren();

    let dailyNotes = [];
    let legacyNotes = [];

    try {
        const dailyData = JSON.parse(readStorage(DAILY_NOTES_KEY, "[]"));
        const legacyData = JSON.parse(readStorage(LEGACY_NOTES_KEY, "[]"));

        dailyNotes = Array.isArray(dailyData) ? dailyData : [];
        legacyNotes = Array.isArray(legacyData) ? legacyData : [];
    } catch (error) {
        showMessage(message, "저장된 노트를 불러오지 못했습니다.", "is-error");
        return;
    }

    const hasNotes = dailyNotes.length > 0 || legacyNotes.length > 0;

    if (!hasNotes) {
        showMessage(message, "아직 작성한 노트가 없습니다.");
        return;
    }

    showMessage(message, "");

    dailyNotes.forEach((note) => {
        const article = document.createElement("article");
        article.className = "note-item";

        const heading = document.createElement("h4");
        heading.textContent = note.title || "제목 없는 노트";

        const subject = document.createElement("p");
        subject.textContent = note.subject ? `수업 주제: ${note.subject}` : "수업 주제 없음";

        const date = document.createElement("small");
        date.textContent = note.date ? `저장일: ${note.date}` : "";

        const sectionList = document.createElement("ol");
        sectionList.className = "saved-note-sections";

        (Array.isArray(note.sections) ? note.sections : []).forEach((section, index) => {
            const item = document.createElement("li");
            const sectionTitle = document.createElement("strong");
            const sectionContent = document.createElement("p");

            sectionTitle.textContent = `${index + 1}. ${section.title || "항목"}`;
            sectionContent.textContent = section.content || "";
            item.append(sectionTitle, sectionContent);
            sectionList.appendChild(item);
        });

        article.append(heading, subject, date, sectionList);
        list.appendChild(article);
    });

    legacyNotes.forEach((note) => {
        const article = document.createElement("article");
        article.className = "note-item";

        const heading = document.createElement("h4");
        heading.textContent = note.title || "제목 없는 노트";

        const content = document.createElement("p");
        content.className = "note-preview";
        content.textContent = note.content || "";

        const date = document.createElement("small");
        date.textContent = note.updatedAt ? `최근 수정: ${note.updatedAt}` : "";

        article.append(heading, content, date);
        list.appendChild(article);
    });
}

/* 이벤트 연결: 현재 페이지에 있는 요소만 실행 */
if (themeButton) {
    themeButton.addEventListener("click", handleThemeClick);
}

if (memoInput) {
    memoInput.addEventListener("input", handleStudyMemoInput);
}

studyChecks.forEach((checkbox) => {
    checkbox.addEventListener("change", saveStudyChecks);
});

if (studyCompleteButton) {
    studyCompleteButton.addEventListener("click", handleStudyComplete);
}

window.addEventListener("pageshow", renderDynamicNotes);
window.addEventListener("storage", (event) => {
    if ([DAILY_NOTES_KEY, LEGACY_NOTES_KEY].includes(event.key)) {
        renderDynamicNotes();
    }
});

loadTheme();
loadStudyMemo();
loadStudyChecks();
renderDynamicNotes();
