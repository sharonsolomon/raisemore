export const EMAIL_VALIDATION_REGEX = /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/;
// Standarized!
export const cleanPhone = (phone) =>
    Number(
        phone
            ?.trim()
            .toString()
            .replaceAll(/[^0-9]/g, "")
            .replaceAll(/^1/g, "") // Remove leading 1
            .replaceAll(/^0+/g, "") // Remove leading 0
            .substring(0, 10)
    );
