/// <reference types="astro/client" />

declare module "@auth/core/types" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      role?: string;
    } & import("@auth/core/types").DefaultSession["user"];
  }
}

declare module "auth-astro" {
  interface User {
    role?: string;
  }
}

declare module "sanitize-html" {
  export interface IOptions {
    allowedTags?: string[] | false;
    allowedAttributes?: Record<string, string[]> | false;
    allowedStyles?: Record<string, Record<string, RegExp[]>> | false;
    allowedSchemes?: string[];
    allowedSchemesByTag?: Record<string, string[]>;
    allowedSchemesAppliedTo?: string[];
    allowProtocolRelative?: boolean;
    transformTags?: Record<
      string,
      | string
      | ((
          tagName: string,
          attribs: Record<string, string>
        ) => { tagName: string; attribs: Record<string, string> })
    >;
    exclusiveFilter?: (frame: {
      tag: string;
      attribs: Record<string, string>;
      text: string;
      tagPosition: number;
    }) => boolean;
  }

  function sanitizeHtml(dirty: string, options?: IOptions): string;
  namespace sanitizeHtml {
    const defaults: IOptions;
  }

  export default sanitizeHtml;
}
