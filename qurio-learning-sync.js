
/**
 * QURIO - DONG BO LO TRINH 8 MON
 * LocalStorage + Google Sheets
 */

(() => {
  "use strict";

  const KEY = "qurio_roadmap_v1_";

  const SUBJECTS = [
    "math",
    "physics",
    "informatics",
    "chemistry",
    "biology",
    "english",
    "history",
    "geography"
  ];

  function account() {
    try {
      const user = JSON.parse(
        localStorage.getItem("nguoiDungHienTai") || "null"
      );

      return (
        user?.email ||
        user?.Email ||
        user?.tenDangNhap ||
        "local"
      );
    } catch (_) {
      return "local";
    }
  }

  function storageKey() {
    return KEY + account();
  }

  function local() {
    try {
      const data = JSON.parse(
        localStorage.getItem(storageKey()) || "{}"
      );

      return data &&
        typeof data === "object" &&
        !Array.isArray(data)
          ? data
          : {};
    } catch (_) {
      return {};
    }
  }

  function newest(records) {
    return Math.max(
      0,
      ...SUBJECTS.map(
        key => Date.parse(
          records?.[key]?.updatedAt || ""
        ) || 0
      )
    );
  }

  function hasLogin() {
    return (
      typeof window.QurioAuth?.request === "function" &&
      account() !== "local"
    );
  }

  let inflight = null;
  let saving = Promise.resolve();

  async function save(records) {
    if (!hasLogin()) {
      return { ok: false, offline: true };
    }

    const snapshot = JSON.parse(
      JSON.stringify(records || {})
    );

    saving = saving.catch(() => {}).then(() =>
      window.QurioAuth.request(
        "learningProfileSave",
        { records: snapshot }
      )
    );

    return saving;
  }

  async function refresh() {
    if (!hasLogin()) {
      return {
        ok: false,
        offline: true,
        records: local()
      };
    }

    if (inflight) return inflight;

    inflight = (async () => {
      const cloud = await window.QurioAuth.request(
        "learningProfileLoad",
        {}
      );

      if (!cloud?.ok) {
        throw Error(
          cloud?.message || "Không tải được hồ sơ học tập."
        );
      }

      const existing = local();

      if (!cloud.found) {
        if (Object.keys(existing).length) {
          await save(existing);
        }

        return {
          ok: true,
          records: existing
        };
      }

      const remote = cloud.records || {};
      const combined = {};

      for (const subject of SUBJECTS) {
        const old = existing[subject];
        const current = remote[subject];

        if (old && current) {
          combined[subject] =
            newest({ [subject]: old }) >
            newest({ [subject]: current })
              ? old
              : current;
        } else if (old || current) {
          combined[subject] = old || current;
        }
      }

      localStorage.setItem(
        storageKey(),
        JSON.stringify(combined)
      );

      window.dispatchEvent(
        new CustomEvent("qurio:learning-sync", {
          detail: { records: combined }
        })
      );

      if (
        JSON.stringify(combined) !==
        JSON.stringify(remote)
      ) {
        await save(combined);
      }

      return {
        ok: true,
        records: combined
      };
    })().finally(() => {
      inflight = null;
    });

    return inflight;
  }

  window.QurioLearningSync = {
    save,
    refresh,
    local,
    storageKey
  };
})();
