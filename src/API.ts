import { API_BASE } from "src";

export default class API {
  public static POST<R>(url: string, data?: Record<string, string | Blob>): Promise<R> {
    return new Promise((success: (r: R) => void, error: (error: string) => void) => {
      const ajax = new XMLHttpRequest();
      ajax.onreadystatechange = () => {
        if (ajax.readyState === 4) {
          if (ajax.status === 200) {
            let r: R | {
              error: string;
            };

            try {
              r = JSON.parse(ajax.responseText);
            } catch (e) {
              error(e.toString());
              return;
            }

            if (
              (r as {
                error: string;
              }).error !== undefined
            ) {
              error((r as {
                error: string;
              }).error);
            }

            success(r as R);
          } else {
            error("Status: " + ajax.status);
          }
        }
      };
      ajax.open("POST", API_BASE + url);
      if (data === undefined) {
        data = {};
      }
      const formData = new FormData();
      for (const key in data) {
        formData.append(key, data[key]);
      }
      ajax.send(formData);
    });
  }
}