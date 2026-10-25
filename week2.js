
const themeButton = document.querySelector("#themeButton");
const noteForm = document.querySelector("#noteForm");
const titleInput = document.querySelector("#title");
const contentInput = document.querySelector("#noteContent");
const saveButton = document.querySelector("#saveButton");
const resetButton = document.querySelector("#resetButton");
const saveMessage = document.querySelector("#saveMessage");
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");

let notes = [];
let editingNoteId = null;

const NOTES_KEY = "savedNotes";
const THEME_KEY = "pageTheme";

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
function showMessage(message, type = "") {
    saveMessage.textContent = message;
    saveMessage.classList.remove("is-saved", "is-error");

    if (type) {
        saveMessage.classList.add(type);
    }
}

/* 저장된 노트 불러오기 */
function loadNotes() {
    try {
        const savedNotes = JSON.parse(readStorage(NOTES_KEY, "[]"));

        if (!Array.isArray(savedNotes)) {
            throw new Error("노트 데이터 형식이 올바르지 않습니다.");
        }

        notes = savedNotes.filter((note) => {
            return (
                note &&
                typeof note.id === "string" &&
                typeof note.title === "string" &&
                typeof note.content === "string"
            );
        });
    } catch (error) {
        console.error("저장된 노트를 불러오지 못했습니다.", error);
        notes = [];
    }
}

/* 노트 ID 생성 */
function createNoteId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* 노트 저장 */
function saveNote(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (title.length === 0 || title.length > 15) {
        showMessage("제목은 1자 이상 15자 이하로 입력해 주세요.", "is-error");
        titleInput.focus();
        return;
    }

    if (content.length === 0) {
        showMessage("노트 내용을 입력해 주세요.", "is-error");
        contentInput.focus();
        return;
    }

    if (content.length > 2000) {
        showMessage("노트 내용은 2,000자 이하로 입력해 주세요.", "is-error");
        contentInput.focus();
        return;
    }

    const previousNotes = [...notes];
    const now = new Date().toLocaleString("ko-KR");
    const wasEditing = editingNoteId !== null;

    if (wasEditing) {
        notes = notes.map((note) => {
            if (note.id === editingNoteId) {
                return {
                    ...note,
                    title,
                    content,
                    updatedAt: now
                };
            }

            return note;
        });
    } else {
        notes.push({
            id: createNoteId(),
            title,
            content,
            createdAt: now,
            updatedAt: now
        });
    }

    if (!writeStorage(NOTES_KEY, JSON.stringify(notes))) {
        notes = previousNotes;
        showMessage("노트를 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.", "is-error");
        return;
    }

    clearNoteForm();
    showMessage(
        wasEditing ? "노트를 수정했습니다. 메인 페이지에서 확인할 수 있습니다." : "노트를 저장했습니다. 메인 페이지에서 확인할 수 있습니다.",
        "is-saved"
    );
}

/* 작성 내용 초기화 */
function clearNoteForm() {
    noteForm.reset();
    editingNoteId = null;
    saveButton.textContent = "저장";
}

/* 테마 불러오기 */
function loadTheme() {
    const savedTheme = readStorage(THEME_KEY, "light");
    const isDark = savedTheme === "dark";

    document.body.classList.toggle("dark", isDark);
    themeButton.textContent = isDark ? "라이트 테마" : "다크 테마";
}

/* 테마 변경 */
function handleThemeClick() {
    const isDark = document.body.classList.toggle("dark");

    themeButton.textContent = isDark ? "라이트 테마" : "다크 테마";

    if (!writeStorage(THEME_KEY, isDark ? "dark" : "light")) {
        showMessage("테마는 변경했지만 설정을 저장하지 못했습니다.", "is-error");
    }
}

/* 탭 전환 */
function activateTab(selectedTab) {
    tabs.forEach((tab) => {
        const isSelected = tab === selectedTab;

        tab.classList.toggle("is-active", isSelected);
        tab.setAttribute("aria-selected", String(isSelected));
        tab.tabIndex = isSelected ? 0 : -1;
    });

    panels.forEach((panel) => {
        panel.hidden = panel.id !== selectedTab.dataset.target;
    });
}

/* 탭 키보드 이동 */
function handleTabKeydown(event) {
    const tabArray = Array.from(tabs);
    const currentIndex = tabArray.indexOf(event.target);

    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % tabArray.length;
    } else if (event.key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + tabArray.length) % tabArray.length;
    } else if (event.key === "Home") {
        nextIndex = 0;
    } else if (event.key === "End") {
        nextIndex = tabArray.length - 1;
    } else {
        return;
    }

    event.preventDefault();

    const nextTab = tabArray[nextIndex];
    activateTab(nextTab);
    nextTab.focus();
}

/* 이벤트 연결 */
noteForm.addEventListener("submit", saveNote);
resetButton.addEventListener("click", clearNoteForm);
themeButton.addEventListener("click", handleThemeClick);

tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", handleTabKeydown);
});

/* 초기 화면 설정 */
loadNotes();
loadTheme();
