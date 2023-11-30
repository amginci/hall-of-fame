import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

const appSettings = {
  databaseURL:
    "https://hall-of-fame-dc107-default-rtdb.europe-west1.firebasedatabase.app/",
};

const app = initializeApp(appSettings);
const database = getDatabase(app);
const hallOfFameInDB = ref(database, "hallOfFame");

const praiseMessageInput = document.getElementById("praise-message");
const praiseFrom = document.getElementById("praise-from");
const praiseTo = document.getElementById("praise-to");
const praiseList = document.getElementById("praise-list");
const publishBtn = document.getElementById("publish-btn");

// Function to check if any input field is empty
function isAnyInputEmpty() {
  return (
    praiseMessageInput.value.trim() === "" ||
    praiseFrom.value.trim() === "" ||
    praiseTo.value.trim() === ""
  );
}

// Function to enable/disable the publish button based on input
function updatePublishButtonState() {
  publishBtn.disabled = isAnyInputEmpty();
}

// Add input event listeners to check for changes
praiseMessageInput.addEventListener("input", updatePublishButtonState);
praiseFrom.addEventListener("input", updatePublishButtonState);
praiseTo.addEventListener("input", updatePublishButtonState);

publishBtn.addEventListener("click", function () {
  if (!isAnyInputEmpty()) {
    let inputValue = {
      inputMessage: praiseMessageInput.value,
      praiseTo: praiseTo.value,
      praiseFrom: praiseFrom.value,
    };

    let newItemRef = push(hallOfFameInDB, inputValue);

    // Initialize likes for the new item
    let likesRef = ref(database, `hallOfFame/${newItemRef.key}/likes`);
    push(likesRef, { isLiked: false });

    clearInputValue();
  }
});

onValue(hallOfFameInDB, function (snapshot) {
  if (snapshot.exists()) {
    let currentPraise = Object.entries(snapshot.val());

    clearPraiseList();

    for (let i = 0; i < currentPraise.length; i++) {
      let currentPraiseID = currentPraise[i][0]

      let praiseMessage = currentPraise[i][1].inputMessage;
      let currentPraiseTo = currentPraise[i][1].praiseTo;
      let currentPraiseFrom = currentPraise[i][1].praiseFrom;

      appendPraiseToPraiseList(praiseMessage, currentPraiseTo, currentPraiseFrom, currentPraiseID);
    }
  } else {
    praiseList.innerHTML = 'No praises added yet'
  }
});

function clearInputValue() {
  // Clear input values
  praiseMessageInput.value = "";
  praiseTo.value = "";
  praiseFrom.value = "";
}

function clearPraiseList() {
  praiseList.innerHTML = "";
}

function appendPraiseToPraiseList(praiseMessage, currentPraiseTo, currentPraiseFrom, currentPraiseID) {
  let itemID = currentPraiseID;

  let newPraiseCard = document.createElement("div");
  newPraiseCard.className = "praise_card";
  praiseList.appendChild(newPraiseCard);

  // // Remove praise card from list
  newPraiseCard.addEventListener('dblclick', function () {
    let exactLocationOfItemInDB = ref(database, `hallOfFame/${itemID}`);
    remove(exactLocationOfItemInDB);
  });

  let newPraiseToName = document.createElement("div");
  newPraiseToName.className = "praise-to_name";
  newPraiseToName.textContent = `To ${currentPraiseTo}`;
  newPraiseCard.appendChild(newPraiseToName);

  let newPraiseContent = document.createElement("div");
  newPraiseContent.className = "praise-content";
  newPraiseContent.textContent = praiseMessage;
  newPraiseCard.appendChild(newPraiseContent);

  let newPraiseReceiver = document.createElement("div");
  newPraiseReceiver.className = "praise-receiver";
  newPraiseCard.appendChild(newPraiseReceiver);

  let newPraiseFromName = document.createElement("div");
  newPraiseFromName.className = "praise-from_name";
  newPraiseFromName.textContent = `From ${currentPraiseFrom}`;
  newPraiseReceiver.appendChild(newPraiseFromName);

  // Like functionality
  let newPraiseLove = document.createElement("div");
  newPraiseLove.className = "praise-love";
  newPraiseReceiver.appendChild(newPraiseLove);

  let newPraiseLoveHeart = document.createElement('span');
  newPraiseLoveHeart.id = 'heart-icon';
  newPraiseLoveHeart.textContent = '♥';
  newPraiseLove.appendChild(newPraiseLoveHeart);

  let newPraiseLoveHeartsCount = document.createElement('span');
  newPraiseLoveHeartsCount.id = 'hearts-count';
  newPraiseLove.appendChild(newPraiseLoveHeartsCount);

  let isLiked = false; // Track whether the card is liked or not

  // Fetch and display likes from the database
  let likesRef = ref(database, `hallOfFame/${itemID}/likes`);
  onValue(likesRef, function (likesSnapshot) {
    let likeEntries = Object.entries(likesSnapshot.val() || {});
    let likeCount = likeEntries.reduce((count, [, like]) => count + (like.isLiked ? 1 : 0), 0);
    newPraiseLoveHeartsCount.textContent = likeCount;
    isLiked = likeEntries.some(([, like]) => like.isLiked); // Check if the user has already liked the entry
  });

  function handleHeartClick() {
    if (isLiked) {
      // If already liked, remove the like
      remove(likesRef);
    } else {
      // If not liked, add the like
      push(likesRef, { isLiked: true });
    }

    // Update the like status
    isLiked = !isLiked;
  }

  newPraiseLoveHeart.addEventListener('click', handleHeartClick);
}
