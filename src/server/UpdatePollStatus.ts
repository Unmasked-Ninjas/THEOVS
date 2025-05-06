import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";

const updatePollStatuses = async () => {
  try {
    console.log("Fetching polls from Firestore...");
    const pollsRef = collection(db, "polls");
    const querySnapshot = await getDocs(pollsRef);
    const now = new Date();

    for (const pollDoc of querySnapshot.docs) {
      const pollData = pollDoc.data();
      console.log(`Processing poll: ${pollData.title} (${pollDoc.id})`);

      // Retrieve start and end times
      const startDate =
        pollData.startDate?.toDate?.() || new Date(pollData.startDate);
      const endDate =
        pollData.endDate?.toDate?.() || new Date(pollData.endDate);

      console.log(`Start Date: ${startDate}, End Date: ${endDate}, Current Time: ${now}`);

      // Determine the new status
      let newStatus = "not started";
      if (now >= startDate && now <= endDate) {
        newStatus = "active";
      } else if (now > endDate) {
        newStatus = "ended";
      }

      console.log(`Current Status: ${pollData.status}, New Status: ${newStatus}`);

      // Update the status in Firestore if it has changed
      if (pollData.status !== newStatus) {
        console.log(`Updating status of poll "${pollData.title}" to "${newStatus}"`);
        await updateDoc(doc(db, "polls", pollDoc.id), { status: newStatus });
        console.log(`Poll "${pollData.title}" updated successfully.`);
      }
    }

    console.log("All poll statuses updated successfully.");
  } catch (error) {
    console.error("Error updating poll statuses:", error);
  }
};

// Run the function every 5 minutes
const startPollStatusUpdater = () => {
  updatePollStatuses(); // Run immediately on start
  setInterval(updatePollStatuses, 5 * 60 * 1000); // Run every 5 minutes
};

export default startPollStatusUpdater;
