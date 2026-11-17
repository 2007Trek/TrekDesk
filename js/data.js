/* =====================================================
   TREKDESK — DATA MANAGEMENT SERVICE
   Activity 6 | ICT251

   Responsibilities:
   1. Store demonstration records.
   2. Retrieve records.
   3. Create records.
   4. Update records.
   5. Delete records.
   6. Validate record data.
   ===================================================== */


// -----------------------------------------------------
// 1. STORAGE CONFIGURATION
// -----------------------------------------------------

const STORAGE_KEY = "trekdesk-support-records-v1";


// -----------------------------------------------------
// 2. ALLOWED RECORD STATUSES
// -----------------------------------------------------

const ALLOWED_STATUSES = [
    "Pending",
    "In progress",
    "Completed"
];


// -----------------------------------------------------
// 3. INITIAL DEMONSTRATION RECORDS
// -----------------------------------------------------

const initialRecords = [

    {
        id: 1,
        title: "Unable to connect to campus Wi-Fi",
        category: "Network",
        description:
            "The laptop connects to the campus wireless network but cannot access the internet.",
        status: "Pending"
    },

    {
        id: 2,
        title: "Microsoft Word installation problem",
        category: "Software",
        description:
            "Microsoft Word fails to complete installation and displays an installation error.",
        status: "In progress"
    },

    {
        id: 3,
        title: "Computer keyboard not responding",
        category: "Hardware",
        description:
            "Several keys on the computer keyboard have stopped responding during normal use.",
        status: "Completed"
    },

    {
        id: 4,
        title: "Slow internet connection in laboratory",
        category: "Network",
        description:
            "Internet access in the computer laboratory is unusually slow, affecting online research.",
        status: "Pending"
    },

    {
        id: 5,
        title: "Antivirus software update failure",
        category: "Software",
        description:
            "The installed antivirus application cannot download or install its latest security updates.",
        status: "In progress"
    },

    {
        id: 6,
        title: "Laptop battery not charging",
        category: "Hardware",
        description:
            "The laptop remains connected to its charger but the battery percentage does not increase.",
        status: "Pending"
    },

    {
        id: 7,
        title: "Unable to access student portal",
        category: "Network",
        description:
            "The student portal fails to load when accessed through the campus internet connection.",
        status: "Completed"
    },

    {
        id: 8,
        title: "PDF reader application crashing",
        category: "Software",
        description:
            "The PDF reader application closes unexpectedly whenever a large document is opened.",
        status: "Pending"
    }

];


// -----------------------------------------------------
// 4. STORAGE INITIALISATION
// -----------------------------------------------------

function initialiseStorage() {

    const existingData = localStorage.getItem(STORAGE_KEY);

    // Seed only when the storage key does not exist.
    // An intentionally empty array must remain empty.

    if (existingData === null) {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(initialRecords)
        );

        return;
    }

    // Detect corrupted JSON rather than silently
    // replacing potentially important user data.

    try {

        const parsedData = JSON.parse(existingData);

        if (!Array.isArray(parsedData)) {
            throw new Error("Stored records must be an array.");
        }

    } catch (error) {

        throw new Error(
            "TrekDesk could not read its saved records. " +
            "The browser storage data may be corrupted."
        );

    }

}


// -----------------------------------------------------
// 5. READ RECORDS FROM STORAGE
// -----------------------------------------------------

function readRecords() {

    initialiseStorage();

    const storedData = localStorage.getItem(STORAGE_KEY);

    const records = JSON.parse(storedData);

    return records;
}


// -----------------------------------------------------
// 6. SAVE RECORDS TO STORAGE
// -----------------------------------------------------

function saveRecords(records) {

    if (!Array.isArray(records)) {

        throw new Error(
            "Invalid storage operation: records must be an array."
        );

    }

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(records)
    );

}


// -----------------------------------------------------
// 7. VALIDATE RECORD DATA
// -----------------------------------------------------

function validateRecord(record) {

    if (
        record === null ||
        typeof record !== "object" ||
        Array.isArray(record)
    ) {

        throw new Error("Invalid record data.");

    }


    const requiredFields = [
        "title",
        "category",
        "description",
        "status"
    ];


    for (const field of requiredFields) {

        if (typeof record[field] !== "string") {

            throw new Error(
                `${field} must be provided as text.`
            );

        }

    }


    const title = record.title.trim();
    const category = record.category.trim();
    const description = record.description.trim();
    const status = record.status.trim();


    if (title.length < 3 || title.length > 80) {

        throw new Error(
            "Title must contain between 3 and 80 characters."
        );

    }


    if (category.length < 2 || category.length > 40) {

        throw new Error(
            "Category must contain between 2 and 40 characters."
        );

    }


    if (
        description.length < 5 ||
        description.length > 300
    ) {

        throw new Error(
            "Description must contain between 5 and 300 characters."
        );

    }


    if (!ALLOWED_STATUSES.includes(status)) {

        throw new Error(
            "Select a valid request status."
        );

    }


    return {
        title,
        category,
        description,
        status
    };

}


// -----------------------------------------------------
// 8. GENERATE A UNIQUE RECORD ID
// -----------------------------------------------------

function generateId(records) {

    if (records.length === 0) {
        return 1;
    }

    const highestId = Math.max(
        ...records.map(record => record.id)
    );

    return highestId + 1;

}


// -----------------------------------------------------
// 9. RECORD SERVICE
// -----------------------------------------------------

export const recordService = {


    // -----------------------------------------------
    // LIST: Return all records
    // -----------------------------------------------

    async list() {

        return readRecords();

    },


    // -----------------------------------------------
    // GET: Retrieve one record by ID
    // -----------------------------------------------

    async get(id) {

        const records = readRecords();

        const numericId = Number(id);

        const record = records.find(
            item => item.id === numericId
        );

        if (!record) {

            throw new Error(
                `Support request ${id} was not found.`
            );

        }

        return record;

    },


    // -----------------------------------------------
    // CREATE: Add a new record
    // -----------------------------------------------

    async create(record) {

        const records = readRecords();

        const validatedRecord = validateRecord(record);

        const newRecord = {

            id: generateId(records),

            ...validatedRecord

        };

        records.push(newRecord);

        saveRecords(records);

        return newRecord;

    },


    // -----------------------------------------------
    // UPDATE: Modify an existing record
    // -----------------------------------------------

    async update(id, record) {

        const records = readRecords();

        const numericId = Number(id);

        const recordIndex = records.findIndex(
            item => item.id === numericId
        );

        if (recordIndex === -1) {

            throw new Error(
                `Support request ${id} was not found.`
            );

        }


        const validatedRecord = validateRecord(record);


        const updatedRecord = {

            id: records[recordIndex].id,

            ...validatedRecord

        };


        records[recordIndex] = updatedRecord;

        saveRecords(records);

        return updatedRecord;

    },


    // -----------------------------------------------
    // REMOVE: Delete an existing record
    // -----------------------------------------------

    async remove(id) {

        const records = readRecords();

        const numericId = Number(id);

        const updatedRecords = records.filter(
            item => item.id !== numericId
        );

        if (updatedRecords.length === records.length) {

            throw new Error(
                `Support request ${id} was not found.`
            );

        }


        saveRecords(updatedRecords);

        return {
            message: "Record deleted."
        };

    }

};