import Bool "mo:base/Bool";
import Hash "mo:base/Hash";

import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Int "mo:base/Int";

actor {
  // Define types
  type Note = {
    id: Nat;
    content: Text;
    isComplete: Bool;
  };

  type DayData = {
    notes: [Note];
    onThisDay: ?{
      title: Text;
      year: Int;
      wikiLink: Text;
    };
  };

  // Create stable variables for persistent storage
  stable var noteIdCounter: Nat = 0;
  stable var dayDataEntries: [(Text, DayData)] = [];

  // Initialize HashMap with stable data
  let dayData = HashMap.fromIter<Text, DayData>(dayDataEntries.vals(), 10, Text.equal, Text.hash);

  // Helper function to get or create DayData
  func getDayData(date: Text) : DayData {
    switch (dayData.get(date)) {
      case null {
        let newDayData = { notes = []; onThisDay = null };
        dayData.put(date, newDayData);
        newDayData
      };
      case (?existingData) existingData;
    };
  };

  // Add a note
  public func addNote(date: Text, content: Text) : async Nat {
    noteIdCounter += 1;
    let newNote: Note = {
      id = noteIdCounter;
      content = content;
      isComplete = false;
    };
    var currentDayData = getDayData(date);
    let updatedNotes = Array.append(currentDayData.notes, [newNote]);
    dayData.put(date, { notes = updatedNotes; onThisDay = currentDayData.onThisDay });
    noteIdCounter
  };

  // Toggle note completion status
  public func toggleNoteComplete(date: Text, noteId: Nat) : async Bool {
    var currentDayData = getDayData(date);
    let updatedNotes = Array.map<Note, Note>(currentDayData.notes, func (note: Note) : Note {
      if (note.id == noteId) {
        return { id = note.id; content = note.content; isComplete = not note.isComplete };
      };
      note
    });
    dayData.put(date, { notes = updatedNotes; onThisDay = currentDayData.onThisDay });
    true
  };

  // Get notes for a specific date
  public query func getNotes(date: Text) : async [Note] {
    let currentDayData = getDayData(date);
    currentDayData.notes
  };

  // Get incomplete note count for a specific date
  public query func getIncompleteNoteCount(date: Text) : async Nat {
    let currentDayData = getDayData(date);
    Array.filter<Note>(currentDayData.notes, func (note: Note) : Bool { not note.isComplete }).size()
  };

  // Set "On This Day" data
  public func setOnThisDay(date: Text, title: Text, year: Int, wikiLink: Text) : async Bool {
    var currentDayData = getDayData(date);
    let updatedDayData = {
      notes = currentDayData.notes;
      onThisDay = ?{ title = title; year = year; wikiLink = wikiLink };
    };
    dayData.put(date, updatedDayData);
    true
  };

  // Get "On This Day" data
  public query func getOnThisDay(date: Text) : async ?{ title: Text; year: Int; wikiLink: Text } {
    let currentDayData = getDayData(date);
    currentDayData.onThisDay
  };

  // System functions for upgrades
  system func preupgrade() {
    dayDataEntries := Iter.toArray(dayData.entries());
  };

  system func postupgrade() {
    dayDataEntries := [];
  };
}
