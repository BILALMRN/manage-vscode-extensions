//groups is
// {"idGroup":
//    {
//        stat: false,
//        items: { "idName": itemName }
//    }
// ;}

const vscode = acquireVsCodeApi();
let groups = {};
const NumRepeatActiveExtensions = {};
const incrementNumRepeatActiveExtensions = (idName) => {
  if (!NumRepeatActiveExtensions[idName]) {
    NumRepeatActiveExtensions[idName] = 0;
  }
  NumRepeatActiveExtensions[idName]++;
};
const decrementNumRepeatActiveExtensions = (idName) => {
  if (
    NumRepeatActiveExtensions[idName] &&
    NumRepeatActiveExtensions[idName] > 0
  ) {
    NumRepeatActiveExtensions[idName]--;
  }
};

// Load groups from local storage on page load
window.onload = function () {
  const storedGroups = JSON.parse(localStorage.getItem("groups")) || {};
  groups = storedGroups;
  renderGroups();
};

// Function to render groups from the groups object
function renderGroups() {
  document.getElementById("groupsContainer").innerHTML = "";
  Object.keys(groups).forEach((groupId) => {
    const groupName = groupId.replace(/-/g, " ");
    const checked = groups[groupId].stat ? "checked" : ""

    const groupDiv = document.createElement("div");
    groupDiv.className = "group";
    groupDiv.id = groupId + "superDiv";
    groupDiv.innerHTML = `
        <div class="actions-content">
            <div class="checkbox-wrapper-8">
              <input class="tgl tgl-skewed" id="cb3-8-${groupId}" onchange="changeCheckBoxStatus.call(this,'${groupId}')" type="checkbox" ${checked} />
              <label class="tgl-btn" data-tg-off="OFF" data-tg-on="ON" for="cb3-8-${groupId}"></label>
            </div>

          <div class="checkbox-wrapper-10" style="padding:10px">
            <input class="tgl tgl-flip" id="cb5-${groupId}" type="checkbox" onchange="changeCheckBoxClear.call(this,'${groupId}')" checked />
            <label class="tgl-btn" data-tg-off="Delete" data-tg-on="Clear!" for="cb5-${groupId}"></label>
          </div>
            <button type="button" onclick="collapsible.call(this,'${groupId}')" class="collapsible">${groupName}</button>
      </div>  
      <div
          style="display:none;"
          id="${groupId}"
          class="divExtensions"
          ondrop="drop(event)"
          ondragover="allowDrop(event)"
        >
        
          ${Object.entries(groups[groupId].items)
            .map(([idName, nameExtension]) => {
              if (groups[groupId].stat)
                incrementNumRepeatActiveExtensions(idName);
              return `
            <div id="${idName}" class="draggable" draggable="true" ondragstart="drag(event)">${nameExtension}</div>
          `;
            })
            .join("")}
        </div>
      `;
    document.getElementById("groupsContainer").appendChild(groupDiv);
  });
}

// Input on keyDown
const keydown = (e) => {
  if (e.code === "Enter") {
    createGroup();
  }
};

// Drag and drop

const createGroup = () => {
  const groupName = document.getElementById("groupName").value;
  if (groupName) {
    const groupId = groupName.replace(/\s+/g, "-");
    if (!groups[groupId]) {
      groups[groupId] = { stat: false, items: {} };
      // statOfGroupExtension[groupId]= false
      saveGroupsToLocalStorage(); // Save to local storage
      const groupDiv = document.createElement("div");
      groupDiv.className = "group";
      groupDiv.id = groupId + "superDiv";
      groupDiv.innerHTML = `
          <div class="actions-content">
            <div class="checkbox-wrapper-8">
              <input class="tgl tgl-skewed" id="cb3-8-${groupId}" onchange="changeCheckBoxStatus.call(this,'${groupId}')" type="checkbox" ${
        groups[groupId].stat ? "checked" : ""
      } />
              <label class="tgl-btn" data-tg-off="OFF" data-tg-on="ON" for="cb3-8-${groupId}"></label>
            </div>

          <div class="checkbox-wrapper-10" style="padding:10px">
            <input class="tgl tgl-flip" id="cb5-${groupId}" type="checkbox" onchange="changeCheckBoxClear.call(this,'${groupId}')" checked />
            <label class="tgl-btn" data-tg-off="Delete" data-tg-on="Clear!" for="cb5-${groupId}"></label>
          </div>
            <button type="button" onclick="collapsible.call(this,'${groupId}')" class="collapsible">${groupName}</button>
      </div>  
      <div
          style="display:block;"
          id="${groupId}"
          class="divExtensions"
          ondrop="drop(event)"
          ondragover="allowDrop(event)"
        >
          </div>
        `;

      document.getElementById("groupsContainer").prepend(groupDiv);
      document.getElementById("groupName").value = "";
    } else {
      sendMessageToExtension(command.successMessage, "Group already exists.");
    }
  } else {
    sendMessageToExtension(command.alertMessage, "Please enter a group name.");
  }
};

const collapsible = function (id) {
  this.classList.toggle("active");
  var content = document.getElementById(id);
  content.style.display = content.style.display === "block" ? "none" : "block";
};

function allowDrop(event) {
  event.preventDefault();
}

function drag(event) {
  const draggedElementId = event.target.id;
  const oldParentId = event.target.parentNode.id;
  event.dataTransfer.setData("text", draggedElementId);
  event.dataTransfer.setData("parentid", oldParentId);
}

function drop(event) {
  event.preventDefault();
  const data = event.dataTransfer.getData("text");
  const oldParentId = event.dataTransfer.getData("parentid");
  const newParentId = event.target.id;
  if (
    newParentId === oldParentId ||
    newParentId === data ||
    !groups[newParentId]
  ) {
    return;
  }

  if (!groups[newParentId]?.items[data]) {
    const draggedElement = document.getElementById(data).cloneNode(true);
    event.target.appendChild(draggedElement);
    // Get the display name or id
    const displayName = draggedElement.textContent;
    groups[newParentId].items[data] = displayName; //store name
    if (groups[newParentId].stat) {
      incrementNumRepeatActiveExtensions(data);
    }
    saveGroupsToLocalStorage(); // Save to local storage
  } else {
    sendMessageToExtension(command.successMessage, "it already exists");
  }
}

function dropRemove(event) {
  event.preventDefault();
  const data = event.dataTransfer.getData("text");
  const oldParentId = event.dataTransfer.getData("parentid");
  const newParentId = event.target.id;
  if (newParentId === oldParentId || newParentId === data) {
    return;
  }


  // Remove from old group

  if (groups[oldParentId]?.items[data]) {
    delete groups[oldParentId].items[data];
    decrementNumRepeatActiveExtensions(data);
    saveGroupsToLocalStorage(); // Save to local storage
  }

  let childElement = document
    .getElementById(oldParentId)
    .querySelector(`#${data.replace(".", "\\.")}`);

  document.getElementById(oldParentId).removeChild(childElement); // Remove the element from the DOM
}

// Function to save groups to local storage
function saveGroupsToLocalStorage() {
  localStorage.setItem("groups", JSON.stringify(groups));
}

//NEW
//#region checkBoxClear
function changeCheckBoxClear(groupId) {
  if (this.checked) {
    // delete
    deleteGroupExtension(groupId);
  } else {
    //just clear
    clearGroupExtension(groupId);
  }
  saveGroupsToLocalStorage(); // Save to local storage
}

function clearGroupExtension(groupId) {
  document.getElementById(groupId).innerHTML = "";
  if (groups.hasOwnProperty(groupId)) {
    Object.entries(groups[groupId].items).forEach(([key, _]) =>
      decrementNumRepeatActiveExtensions(key)
    );
    delete groups[groupId];
  }
  groups[groupId] = { stat: false, items: {} };
}

function deleteGroupExtension(groupId) {
  let child = document.getElementById(groupId + "superDiv");
  child.parentNode.removeChild(child);
  if (groups.hasOwnProperty(groupId)) {
    Object.entries(groups[groupId].items).forEach(([key, _]) =>
      decrementNumRepeatActiveExtensions(key)
    );
    delete groups[groupId];
  } else {
    sendMessageToExtension(
      command.alertMessage,
      `Group ${groupId} does not exist.`
    );
  }
}
//#endregion checkBoxClear

//#region status extension
function changeCheckBoxStatus(groupId) {
  if (!navigator.onLine) {
    this.checked = !this.checked;
    sendMessageToExtension(command.connectionStatus, "You are offline");
    return;
  }

  const extensionIds = Object.keys(groups[groupId].items);
  if (this.checked) {
    extensionIds.forEach((id) => incrementNumRepeatActiveExtensions(id));
    groups[groupId].stat = true;
    sendDataToExtension(command.enableExtensions, extensionIds);
  } else {
    const filteredExtensionIds = extensionIds.filter((id) => {
      if (NumRepeatActiveExtensions[id] && NumRepeatActiveExtensions[id] >= 1) {
        decrementNumRepeatActiveExtensions(id);
        return true;
      }
      return false;
    });
    groups[groupId].stat = false;
    sendDataToExtension(command.disableExtensions, filteredExtensionIds);
  }
  saveGroupsToLocalStorage();
}

//#endregion status extension

const command = Object.freeze({
  enableExtensions: "enableExtensions",
  disableExtensions: "disableExtensions",
  successMessage: "successMessage",
  alertMessage: "alertMessage",
  connectionStatus: "connectionStatus",
});

const sendMessageToExtension = (command, data) =>
  sendDataToExtension(command, data);
function sendDataToExtension(command, data) {
  // Send a message to the extension
  vscode.postMessage({
    command: command,
    data: data,
  });
}
