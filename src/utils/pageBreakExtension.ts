import { Node, mergeAttributes } from '@tiptap/core';

export interface PageBreakOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      /**
       * Insert a page break
       */
      setPageBreak: () => ReturnType;
    };
  }
}

export const PageBreak = Node.create<PageBreakOptions>({
  name: 'pageBreak',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'page-break',
        class: 'page-break',
      }),
    ];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({ type: this.name })
            .command(({ tr, dispatch }) => {
              if (dispatch) {
                const { parent, pos } = tr.selection.$from;
                const posAfter = pos + 1;
                const nodeAfter = tr.doc.nodeAt(posAfter);

                if (!nodeAfter) {
                  const node = parent.type.contentMatch.defaultType?.create();
                  if (node) {
                    tr.insert(posAfter, node);
                    tr.setSelection(
                      new (tr.selection.constructor as any)(tr.doc.resolve(posAfter))
                    );
                  }
                }
              }

              return true;
            })
            .run();
        },
    };
  },
});

export default PageBreak;
