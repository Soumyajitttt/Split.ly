// const generateUniqueGroupCode = async () => {
//     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//     let groupCode;
//     let isUnique = false;
//     while (!isUnique) {
//         groupCode = '';
//         for (let i = 0; i < 6; i++) {
//             groupCode += characters.charAt(Math.floor(Math.random() * characters.length));
//         }
//         const existingGroup = await Group.findOne({ groupcode: groupCode });
//         if (!existingGroup) {
//             isUnique = true;
//         }
//     }
//     return groupCode;
// };

// Improved version with limited attempts to prevent infinite loop 
export const generateUniqueGroupCode = async () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let attempts = 0;

    while (attempts < 5) {
        let groupCode = '';

        for (let i = 0; i < 6; i++) {
            groupCode += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        const existingGroup = await Group.findOne({ groupcode: groupCode });

        if (!existingGroup) {
            return groupCode;
        }

        attempts++;
    }

    throw new Error("Failed to generate unique group code");
};