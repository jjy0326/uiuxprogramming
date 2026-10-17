const themeButton = document.querySelector("#themeButton");

const memoInput = document.querySelector("#nickname");
const memoMessage = document.querySelector("#memoMessage");

const mainTitle = document.querySelector("#mainTitle");

const studyChecks = document.querySelectorAll(".study-check");
const studyProgress = document.querySelector("#studyProgress");
const studyCompleteButton = document.querySelector("#studyCompleteButton");
const studyCompleteMessage = document.querySelector("#studyCompleteMessage");

const noteForm = document.querySelector("#noteForm");
const titleInput = document.querySelector("#title");
const contentInput = document.querySelector("#noteContent");
const saveButton = document.querySelector("#saveButton");
const resetButton = document.querySelector("#resetButton");
const saveMessage = document.querySelector("#saveMessage");
const noteList = document.querySelector("#noteList");

const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");

let notes = [];
let editingNoteId = null;

/* localStorage 읽기 */
function readStorage(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);

        if (value === null) {
            return defaultValue;
        }

        return value;
    } catch (error) {
        console.error("저장된 데이터를 읽지 못했습니다.", error);
        return defaultValue;
    }
}

/* localStorage 저장 */
function writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.error("데이터 저장에 실패했습니다.", error);
        return false;
    }
}

/* localStorage 삭제 */
function removeStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error("저장된 데이터를 삭제하지 못했습니다.", error);
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

/* 제목 입력값 확인 */
function isValidTitle(title) {
    return title.length > 0 && title.length <= 15;
}

/* 페이지 제목 불러오기 */
function loadTitle() {
    const savedTitle = readStorage("pageTitle");

    if (savedTitle && savedTitle.trim()) {
        mainTitle.textContent = savedTitle;
        document.title = savedTitle;
    }
}

/* 메모 입력 및 저장 */
function handleStudyMemoInput() {
    const memo = memoInput.value.trim();

    if (writeStorage("studyMemo", memo)) {
        showMessage(
            memoMessage,
            memo ? "메모가 저장되었습니다." : "메모가 비어 있습니다."
        );
    } else {
        showMessage(memoMessage, "메모 저장에 실패했습니다.", "is-error");
    }
}

/* 저장된 메모 불러오기 */
function loadStudyMemo() {
    const savedMemo = readStorage("studyMemo", "");

    memoInput.value = savedMemo || "";

    if (savedMemo) {
        showMessage(memoMessage, "저장된 메모를 불러왔습니다.");
    }
}

/* 학습 체크리스트 진행률 */
function updateStudyProgress() {
    const checkedCount = document.querySelectorAll(
        ".study-check:checked"
    ).length;

    studyProgress.textContent =
        `학습 진행률: ${checkedCount}/${studyChecks.length}`;
}

/* 체크리스트 상태 저장 */
function saveStudyChecks() {
    const checkedValues = [];

    studyChecks.forEach((checkbox) => {
        if (checkbox.checked) {
            checkedValues.push(checkbox.value);
        }
    });

    if (!writeStorage("studyChecks", JSON.stringify(checkedValues))) {
        showMessage(
            studyCompleteMessage,
            "학습 상태 저장에 실패했습니다.",
            "is-error"
        );
    }

    updateStudyProgress();
}

/* 저장된 체크리스트 불러오기 */
function loadStudyChecks() {
    const savedChecks = readStorage("studyChecks", "[]");

    try {
        const checkedValues = JSON.parse(savedChecks);

        if (!Array.isArray(checkedValues)) {
            throw new Error("체크리스트 데이터 형식이 올바르지 않습니다.");
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
    const checkedCount = document.querySelectorAll(
        ".study-check:checked"
    ).length;

    if (checkedCount === studyChecks.length) {
        showMessage(
            studyCompleteMessage,
            "모든 학습 항목을 확인했습니다."
        );
    } else {
        showMessage(
            studyCompleteMessage,
            `${studyChecks.length - checkedCount}개 항목이 남아 있습니다.`
        );
    }
}

/* 저장된 노트 불러오기 */
function loadNotes() {
    const savedNotes = readStorage("savedNotes", "[]");

    try {
        const parsedNotes = JSON.parse(savedNotes);

        if (!Array.isArray(parsedNotes)) {
            throw new Error("노트 데이터 형식이 올바르지 않습니다.");
        }

        notes = parsedNotes.filter((note) => {
            return (
                note &&
                typeof note.id === "string" &&
                typeof note.title === "string" &&
                typeof note.content === "string"
            );
        });
    } catch (error) {
        console.error("노트를 불러오지 못했습니다.", error);
        notes = [];
    }

    renderNotes();
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

    if (!isValidTitle(title)) {
        showMessage(
            saveMessage,
            "제목은 1자 이상 15자 이하로 입력해 주세요.",
            "is-error"
        );
        titleInput.focus();
        return;
    }

    if (!content) {
        showMessage(
            saveMessage,
            "노트 내용을 입력해 주세요.",
            "is-error"
        );
        contentInput.focus();
        return;
    }

    if (content.length > 2000) {
        showMessage(
            saveMessage,
            "노트 내용은 2000자 이하로 입력해 주세요.",
            "is-error"
        );
        contentInput.focus();
        return;
    }

    const previousNotes = [...notes];
    const now = new Date().toLocaleString("ko-KR");

    if (editingNoteId) {
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

    if (!writeStorage("savedNotes", JSON.stringify(notes))) {
        notes = previousNotes;

        showMessage(
            saveMessage,
            "노트를 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.",
            "is-error"
        );

        renderNotes();
        return;
    }

    const savedPageTitle = writeStorage("pageTitle", title);

    mainTitle.textContent = title;
    document.title = title;

    renderNotes();
    clearNoteForm();

    if (!savedPageTitle) {
        showMessage(
            saveMessage,
            "노트는 저장했지만 페이지 제목 저장에는 실패했습니다.",
            "is-error"
        );
        return;
    }

    showMessage(
        saveMessage,
        editingNoteId ? "노트 수정 성공!." : "노트 저장 성공!.",
        "is-saved"
    );
}

/* 노트 목록 표시 */
function renderNotes() {
    noteList.replaceChildren();

    notes.forEach((note) => {
        const listItem = document.createElement("li");
        listItem.classList.add("note-item");

        const noteTitle = document.createElement("h4");
        noteTitle.textContent = note.title;

        const noteContent = document.createElement("p");
        noteContent.textContent = note.content;

        const noteDate = document.createElement("small");
        noteDate.textContent = note.updatedAt
            ? `최근 수정: ${note.updatedAt}`
            : "";

        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("note-buttons");

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "수정";
        editButton.addEventListener("click", () => {
            editNote(note.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "삭제";
        deleteButton.addEventListener("click", () => {
            deleteNote(note.id);
        });

        buttonContainer.append(editButton, deleteButton);

        listItem.append(
            noteTitle,
            noteContent,
            noteDate,
            buttonContainer
        );

        noteList.appendChild(listItem);
    });

    if (notes.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.textContent = "저장된 노트가 없습니다.";
        noteList.appendChild(emptyMessage);
    }
}

/* 노트 수정 */
function editNote(id) {
    const note = notes.find((item) => item.id === id);

    if (!note) {
        showMessage(saveMessage, "수정할 노트를 찾을 수 없습니다.", "is-error");
        return;
    }

    editingNoteId = id;

    titleInput.value = note.title;
    contentInput.value = note.content;
    saveButton.textContent = "수정 저장!";

    showMessage(saveMessage, "노트를 수정한 뒤 저장해 주세요.");

    document.querySelector("#form").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    titleInput.focus();
}

/* 노트 삭제 */
function deleteNote(id) {
    const note = notes.find((item) => item.id === id);

    if (!note) {
        return;
    }

    const confirmed = window.confirm(
        `"${note.title}"정말 노트를 삭제할까요?`
    );

    if (!confirmed) {
        return;
    }

    const previousNotes = [...notes];
    notes = notes.filter((item) => item.id !== id);

    if (!writeStorage("savedNotes", JSON.stringify(notes))) {
        notes = previousNotes;

        showMessage(
            saveMessage,
            "노트를 삭제하지 못했습니다.",
            "is-error"
        );

        renderNotes();
        return;
    }

    if (editingNoteId === id) {
        clearNoteForm();
    }

    renderNotes();
    showMessage(saveMessage, "노트가 삭제되었습니다.", "is-saved");
}

/* 노트 입력 초기화 */
function clearNoteForm() {
    noteForm.reset();
    editingNoteId = null;
    saveButton.textContent = "노트 저장 완료!";
}

/* 입력 초기화 버튼 */
function resetNote() {
    clearNoteForm();
    showMessage(saveMessage, "입력 내용이 초기화되었습니다.");
}

/* 테마 불러오기 */
function loadTheme() {
    const savedTheme = readStorage("pageTheme", "light");

    document.body.classList.toggle("dark", savedTheme === "dark");

    themeButton.textContent =
        savedTheme === "dark" ? "라이트 테마" : "다크 테마";
}

/* 테마 변경 */
function handleThemeClick() {
    const isDark = document.body.classList.toggle("dark");
    const theme = isDark ? "dark" : "light";

    themeButton.textContent = isDark ? "라이트 테마" : "다크 테마";

    if (!writeStorage("pageTheme", theme)) {
        showMessage(
            memoMessage,
            "테마는 변경했지만 설정 저장에 실패.",
            "is-error"
        );
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
themeButton.addEventListener("click", handleThemeClick);

memoInput.addEventListener("input", handleStudyMemoInput);

studyChecks.forEach((checkbox) => {
    checkbox.addEventListener("change", saveStudyChecks);
});

studyCompleteButton.addEventListener("click", handleStudyComplete);

noteForm.addEventListener("submit", saveNote);
resetButton.addEventListener("click", resetNote);

tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        activateTab(tab);
    });

    tab.addEventListener("keydown", handleTabKeydown);
});

/* 초기 화면 설정 */
loadTitle();
loadStudyMemo();
loadStudyChecks();
loadNotes();
loadTheme();