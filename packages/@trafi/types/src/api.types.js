"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isApiSuccess = isApiSuccess;
exports.isApiError = isApiError;
function isApiSuccess(response) {
    return response.success === true;
}
function isApiError(response) {
    return response.success === false;
}
//# sourceMappingURL=api.types.js.map