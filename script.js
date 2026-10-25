
const themeButton = document.querySelector("#themeButton");

const memoInput = document.querySelector("#nickname");
const memoMessage = document.querySelector("#memoMessage");

const studyChecks = document.querySelectorAll(".study-check");
const studyProgress = document.querySelector("#studyProgress");
const studyCompleteButton = document.querySelector("#studyCompleteButton");
const studyCompleteMessage = document.querySelector("#studyCompleteMessage");

const noteList = document.querySelector("#noteList");

const NOTES_KEY = "savedNotes";

/* 저장된 데이터 불러오기 */
function readStorage(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? defaultValue : value;
    } catch (error) {
        console.error("데이터를 불러오지 못했습니다.", error);
        return defaultValue;
    }
}

/* 데이터 저장하기 */
function writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.error("데이터 저장에 실패했습니다.", error);
        return false;
    }
}

/* 안내 문구 표시 */
function showMessage(element, message, type = "") {
    element.textContent = message;
    element.classList.remove("is-saved", "is-error");

    if (type) {
        element.classList.add(type);
    }
}

/* 간단 메모 저장 */
function handleStudyMemoInput() {
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

/* 간단 메모 불러오기 */
function loadStudyMemo() {
    const savedMemo = readStorage("studyMemo", "");
    memoInput.value = savedMemo || "";

    if (savedMemo) {
        showMessage(memoMessage, "저장된 메모를 불러왔습니다.", "is-saved");
    }
}

/* 학습 진행률 표시 */
function updateStudyProgress() {
    const checkedCount = document.querySelectorAll(
        ".study-check:checked"
    ).length;

    studyProgress.textContent =
        `학습 진행률: ${checkedCount}/${studyChecks.length}`;
}

/* 체크리스트 저장 */
function saveStudyChecks() {
    const checkedValues = Array.from(studyChecks)
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.value);

    if (!writeStorage("studyChecks", JSON.stringify(checkedValues))) {
        showMessage(
            studyCompleteMessage,
            "학습 상태 저장에 실패했습니다.",
            "is-error"
        );
    }

    updateStudyProgress();
}

/* 체크리스트 불러오기 */
function loadStudyChecks() {
    try {
        const checkedValues = JSON.parse(
            readStorage("studyChecks", "[]")
        );

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

/* 학습 완료 확인 */
function handleStudyComplete() {
    const checkedCount = Array.from(studyChecks)
        .filter((checkbox) => checkbox.checked)
        .length;

    if (checkedCount === studyChecks.length) {
        showMessage(
            studyCompleteMessage,
            "모든 학습 항목을 확인했습니다.",
            "is-saved"
        );
    } else {
        showMessage(
            studyCompleteMessage,
            `${studyChecks.length - checkedCount}개 항목이 남아 있습니다.`
        );
    }
}

/* 저장된 노트 표시 */
function renderNotes() {
    let notes = [];

    try {
        const savedNotes = JSON.parse(
            readStorage(NOTES_KEY, "[]")
        );

        if (Array.isArray(savedNotes)) {
            notes = savedNotes.filter((note) => {
                return (
                    note &&
                    typeof note.title === "string" &&
                    typeof note.content === "string"
                );
            });
        }
    } catch (error) {
        console.error("저장된 노트를 불러오지 못했습니다.", error);
    }

    noteList.replaceChildren();

    if (notes.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.textContent = "저장된 노트가 없습니다.";
        noteList.appendChild(emptyItem);
        return;
    }

    notes.forEach((note) => {
        const item = document.createElement("li");
        item.classList.add("note-item");

        const title = document.createElement("h3");
        title.textContent = note.title;

        const content = document.createElement("p");
        content.classList.add("note-preview");
        content.textContent = note.content;

        const date = document.createElement("small");
        date.textContent = note.updatedAt
            ? `최근 수정: ${note.updatedAt}`
            : "";

        item.append(title, content, date);
        noteList.appendChild(item);
    });
}

/* 테마 불러오기 */
function loadTheme() {
    const savedTheme = readStorage("pageTheme", "light");
    const isDark = savedTheme === "dark";

    document.body.classList.toggle("dark", isDark);
    themeButton.textContent = isDark ? "라이트 테마" : "다크 테마";
}

/* 테마 변경 */
function handleThemeClick() {
    const isDark = document.body.classList.toggle("dark");

    themeButton.textContent = isDark ? "라이트 테마" : "다크 테마";

    if (!writeStorage("pageTheme", isDark ? "dark" : "light")) {
        showMessage(
            memoMessage,
            "테마는 변경했지만 설정 저장에 실패했습니다.",
            "is-error"
        );
    }
}

/* 이벤트 연결 */
themeButton.addEventListener("click", handleThemeClick);
memoInput.addEventListener("input", handleStudyMemoInput);

studyChecks.forEach((checkbox) => {
    checkbox.addEventListener("change", saveStudyChecks);
});

studyCompleteButton.addEventListener("click", handleStudyComplete);

/* 다른 페이지에서 돌아오면 최신 노트 표시 */
window.addEventListener("pageshow", renderNotes);

/* 다른 탭에서 노트가 변경된 경우에도 갱신 */
window.addEventListener("storage", (event) => {
    if (event.key === NOTES_KEY) {
        renderNotes();
    }
});

/* 초기 화면 설정 */
loadStudyMemo();
loadStudyChecks();
loadTheme();
renderNotes();
