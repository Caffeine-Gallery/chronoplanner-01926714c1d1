import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Note {
  'id' : bigint,
  'content' : string,
  'isComplete' : boolean,
}
export interface _SERVICE {
  'addNote' : ActorMethod<[string, string], bigint>,
  'getIncompleteNoteCount' : ActorMethod<[string], bigint>,
  'getNotes' : ActorMethod<[string], Array<Note>>,
  'getOnThisDay' : ActorMethod<
    [string],
    [] | [{ 'title' : string, 'wikiLink' : string, 'year' : bigint }]
  >,
  'setOnThisDay' : ActorMethod<[string, string, bigint, string], boolean>,
  'toggleNoteComplete' : ActorMethod<[string, bigint], boolean>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
