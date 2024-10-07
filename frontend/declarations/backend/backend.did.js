export const idlFactory = ({ IDL }) => {
  const Note = IDL.Record({
    'id' : IDL.Nat,
    'content' : IDL.Text,
    'isComplete' : IDL.Bool,
  });
  return IDL.Service({
    'addNote' : IDL.Func([IDL.Text, IDL.Text], [IDL.Nat], []),
    'getIncompleteNoteCount' : IDL.Func([IDL.Text], [IDL.Nat], ['query']),
    'getNotes' : IDL.Func([IDL.Text], [IDL.Vec(Note)], ['query']),
    'getOnThisDay' : IDL.Func(
        [IDL.Text],
        [
          IDL.Opt(
            IDL.Record({
              'title' : IDL.Text,
              'wikiLink' : IDL.Text,
              'year' : IDL.Int,
            })
          ),
        ],
        ['query'],
      ),
    'setOnThisDay' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Int, IDL.Text],
        [IDL.Bool],
        [],
      ),
    'toggleNoteComplete' : IDL.Func([IDL.Text, IDL.Nat], [IDL.Bool], []),
  });
};
export const init = ({ IDL }) => { return []; };
