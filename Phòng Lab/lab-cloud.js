
/* QURIO LAB - KET NOI GOOGLE SHEETS */

(() => {
  "use strict";

  async function request(operation, data = {}) {
    if (!window.QurioAuth?.request) {
      throw new Error("Vui lòng đăng nhập Qurio.");
    }

    return window.QurioAuth.request("labData", {
      operation,
      ...data
    });
  }

  window.QurioLabCloud = {
    request,

    list() {
      return request("list");
    },

    goalSave(item) {
      return request("goalSave", {
        id: item.id,
        text: item.text,
        done: item.done === true
      });
    },

    goalDelete(id) {
      return request("goalDelete", { id });
    },

    fileSave(item) {
      return request("fileSave", item);
    },

    fileDelete(id) {
      return request("fileDelete", { id });
    },

    historyAdd(item) {
      return request("historyAdd", item);
    }
  };

  console.log("Qurio Lab: Đã tải kết nối CSDL");
})();
