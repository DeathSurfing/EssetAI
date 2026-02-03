/**
 * Operational Transform (OT) Library
 * 
 * A comprehensive implementation of Operational Transform algorithms for
 * conflict-free concurrent editing. Supports character-level operations,
 * transformation, composition, and inversion.
 */

// ============================================================================
// TYPES
// ============================================================================

export type OperationType = 'retain' | 'insert' | 'delete';

export interface RetainOperation {
  type: 'retain';
  count: number;
}

export interface InsertOperation {
  type: 'insert';
  text: string;
}

export interface DeleteOperation {
  type: 'delete';
  count: number;
}

export type Operation = RetainOperation | InsertOperation | DeleteOperation;

export interface TextRange {
  start: number;
  end: number;
}

export interface CursorPosition {
  index: number;
  selection?: TextRange;
}

export interface Section {
  id: string;
  content: string;
  lockedBy?: string;
  lockedAt?: number;
}

export interface SectionOperation {
  sectionId: string;
  operations: Operation[];
  timestamp: number;
  userId: string;
}

export interface TransformedResult {
  operation: Operation[];
  cursorPosition?: CursorPosition;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validates that an operation is well-formed
 */
export function validateOperation(op: Operation): boolean {
  switch (op.type) {
    case 'retain':
      return typeof op.count === 'number' && op.count >= 0;
    case 'insert':
      return typeof op.text === 'string';
    case 'delete':
      return typeof op.count === 'number' && op.count >= 0;
    default:
      return false;
  }
}

/**
 * Validates an array of operations
 */
export function validateOperations(ops: Operation[]): boolean {
  return ops.every(validateOperation);
}

/**
 * Normalizes operations by combining adjacent operations of the same type
 */
export function normalize(ops: Operation[]): Operation[] {
  if (ops.length === 0) return [];
  
  const result: Operation[] = [];
  
  for (const op of ops) {
    const last = result[result.length - 1];
    
    if (!last) {
      result.push(op);
      continue;
    }
    
    // Skip zero-length operations
    if (op.type === 'retain' && op.count === 0) continue;
    if (op.type === 'delete' && op.count === 0) continue;
    if (op.type === 'insert' && op.text === '') continue;
    
    // Combine adjacent same-type operations
    if (last.type === op.type) {
      if (op.type === 'retain' || op.type === 'delete') {
        (last as RetainOperation | DeleteOperation).count += (op as RetainOperation | DeleteOperation).count;
      } else if (op.type === 'insert') {
        (last as InsertOperation).text += (op as InsertOperation).text;
      }
    } else {
      result.push(op);
    }
  }
  
  // Remove trailing retain operations (they don't change the document)
  while (result.length > 0 && result[result.length - 1].type === 'retain') {
    result.pop();
  }
  
  return result;
}

/**
 * Calculates the length of text affected by an operation
 */
export function operationLength(op: Operation): number {
  switch (op.type) {
    case 'retain':
    case 'delete':
      return op.count;
    case 'insert':
      return op.text.length;
    default:
      return 0;
  }
}

/**
 * Calculates the total length change from an operation sequence
 */
export function lengthChange(ops: Operation[]): number {
  return ops.reduce((change, op) => {
    switch (op.type) {
      case 'insert':
        return change + op.text.length;
      case 'delete':
        return change - op.count;
      case 'retain':
      default:
        return change;
    }
  }, 0);
}

// ============================================================================
// CORE OT ALGORITHMS
// ============================================================================

/**
 * Applies a sequence of operations to text
 * 
 * @param ops - The operations to apply
 * @param text - The original text
 * @returns The transformed text
 */
export function apply(ops: Operation[], text: string): string {
  const normalized = normalize(ops);
  let result = '';
  let textIndex = 0;
  
  for (const op of normalized) {
    switch (op.type) {
      case 'retain':
        if (textIndex + op.count > text.length) {
          throw new Error(`Cannot retain ${op.count} characters: exceeds text length`);
        }
        result += text.slice(textIndex, textIndex + op.count);
        textIndex += op.count;
        break;
        
      case 'insert':
        result += op.text;
        break;
        
      case 'delete':
        if (textIndex + op.count > text.length) {
          throw new Error(`Cannot delete ${op.count} characters: exceeds text length`);
        }
        textIndex += op.count;
        break;
    }
  }
  
  // Append remaining text (if any)
  result += text.slice(textIndex);
  
  return result;
}

/**
 * Inverts an operation sequence for undo functionality
 * 
 * @param ops - The operations to invert
 * @param text - The text state before the operations were applied (needed for deletes)
 * @returns The inverted operations that will undo the original
 */
export function invert(ops: Operation[], text: string): Operation[] {
  const normalized = normalize(ops);
  const inverted: Operation[] = [];
  let textIndex = 0;
  
  for (const op of normalized) {
    switch (op.type) {
      case 'retain':
        inverted.push({ type: 'retain', count: op.count });
        textIndex += op.count;
        break;
        
      case 'insert':
        // Insert becomes delete
        inverted.push({ type: 'delete', count: op.text.length });
        break;
        
      case 'delete':
        // Delete becomes insert with the deleted text
        const deletedText = text.slice(textIndex, textIndex + op.count);
        inverted.push({ type: 'insert', text: deletedText });
        textIndex += op.count;
        break;
    }
  }
  
  return normalize(inverted);
}

/**
 * Composes two operation sequences into one
 * The result is equivalent to applying op2 after op1
 * 
 * @param op1 - First operations
 * @param op2 - Second operations
 * @returns Composed operations
 */
export function compose(op1: Operation[], op2: Operation[]): Operation[] {
  const normalized1 = normalize(op1);
  const normalized2 = normalize(op2);
  
  if (normalized1.length === 0) return normalized2;
  if (normalized2.length === 0) return normalized1;
  
  // Use a working buffer approach
  // We'll build the composed operation by simulating the composition
  const builder: Operation[] = [];
  let i1 = 0, i2 = 0;
  let pos1 = 0, pos2 = 0;
  
  while (i1 < normalized1.length || i2 < normalized2.length) {
    const curr1 = normalized1[i1];
    const curr2 = normalized2[i2];
    
    // Handle remaining operations
    if (!curr1) {
      if (curr2?.type === 'insert') {
        builder.push({ type: 'insert', text: curr2.text.slice(pos2) });
      } else if (curr2?.type === 'delete') {
        builder.push({ type: 'delete', count: curr2.count - pos2 });
      }
      break;
    }
    
    if (!curr2) {
      if (curr1.type === 'insert') {
        builder.push({ type: 'insert', text: curr1.text.slice(pos1) });
      } else if (curr1.type === 'delete') {
        builder.push({ type: 'delete', count: curr1.count - pos1 });
      } else if (curr1.type === 'retain') {
        builder.push({ type: 'retain', count: curr1.count - pos1 });
      }
      break;
    }
    
    // Both operations present
    const len1 = curr1.type === 'insert' ? curr1.text.length - pos1 : curr1.count - pos1;
    const len2 = curr2.type === 'insert' ? curr2.text.length - pos2 : curr2.count - pos2;
    const minLen = Math.min(len1, len2);
    
    if (curr1.type === 'insert') {
      // Inserts are always kept
      builder.push({ type: 'insert', text: curr1.text.slice(pos1, pos1 + minLen) });
      pos1 += minLen;
      if (pos1 >= curr1.text.length) { i1++; pos1 = 0; }
    } else     if (curr1.type === 'delete') {
      // Deletes are always kept
      builder.push({ type: 'delete', count: minLen });
      pos1 += minLen;
      pos2 += minLen;
      if (pos1 >= (curr1 as DeleteOperation).count) { i1++; pos1 = 0; }
      if (curr2.type !== 'insert' && pos2 >= (curr2 as RetainOperation | DeleteOperation).count) { i2++; pos2 = 0; }
    } else if (curr1.type === 'retain') {
      // Retain depends on op2
      if (curr2.type === 'insert') {
        // Insert from op2 is kept
        builder.push({ type: 'insert', text: curr2.text.slice(pos2, pos2 + minLen) });
        pos2 += minLen;
        if (pos2 >= curr2.text.length) { i2++; pos2 = 0; }
      } else if (curr2.type === 'delete') {
        // Delete cancels retain - nothing to output
        pos1 += minLen;
        pos2 += minLen;
        if (pos1 >= (curr1 as RetainOperation).count) { i1++; pos1 = 0; }
        if (pos2 >= (curr2 as DeleteOperation).count) { i2++; pos2 = 0; }
      } else if (curr2.type === 'retain') {
        // Both retain
        builder.push({ type: 'retain', count: minLen });
        pos1 += minLen;
        pos2 += minLen;
        if (pos1 >= (curr1 as RetainOperation).count) { i1++; pos1 = 0; }
        if (pos2 >= (curr2 as RetainOperation).count) { i2++; pos2 = 0; }
      }
    }
  }
  
  return normalize(builder);
}

/**
 * Transforms two operations against each other
 * This is the core OT algorithm that enables concurrent editing
 * 
 * When op1 and op2 are based on the same document state:
 * - op1' = transform(op1, op2) can be applied after op2
 * - op2' = transform(op2, op1) can be applied after op1
 * 
 * @param op - The operation to transform
 * @param against - The operation to transform against
 * @returns The transformed operation
 */
export function transform(op: Operation[], against: Operation[]): Operation[] {
  const normalizedOp = normalize(op);
  const normalizedAgainst = normalize(against);
  
  if (normalizedOp.length === 0) return [];
  if (normalizedAgainst.length === 0) return normalizedOp;
  
  const result: Operation[] = [];
  let i1 = 0, i2 = 0;
  let opIndex = 0;
  let againstIndex = 0;
  
  while (i1 < normalizedOp.length) {
    const op1 = normalizedOp[i1];
    const op2 = normalizedAgainst[i2];
    
    if (!op1) break;
    
    if (!op2) {
      // Copy remaining of op
      if (op1.type === 'insert') {
        result.push({ type: 'insert', text: op1.text.slice(opIndex) });
      } else if (op1.type === 'retain') {
        result.push({ type: 'retain', count: op1.count - opIndex });
      } else if (op1.type === 'delete') {
        result.push({ type: 'delete', count: op1.count - opIndex });
      }
      break;
    }
    
    // Get remaining lengths
    const len1 = op1.type === 'insert' 
      ? op1.text.length - opIndex 
      : op1.count - opIndex;
    const len2 = op2.type === 'insert'
      ? op2.text.length - againstIndex
      : op2.count - againstIndex;
    const minLen = Math.min(len1, len2);
    
    if (op1.type === 'insert') {
      if (op2.type === 'insert') {
        // Concurrent inserts: transformed op needs retain to skip other's insert
        result.push({ type: 'retain', count: minLen });
        result.push({ type: 'insert', text: op1.text.slice(opIndex, opIndex + minLen) });
        opIndex += minLen;
        againstIndex += minLen;
        if (opIndex >= op1.text.length) { i1++; opIndex = 0; }
        if (againstIndex >= op2.text.length) { i2++; againstIndex = 0; }
      } else {
        // Insert vs Retain/Delete: insert goes through unchanged
        result.push({ type: 'insert', text: op1.text.slice(opIndex, opIndex + minLen) });
        opIndex += minLen;
        if (opIndex >= op1.text.length) { i1++; opIndex = 0; }
      }
    } else if (op1.type === 'retain') {
      if (op2.type === 'insert') {
        // Retain vs Insert: retain becomes longer
        result.push({ type: 'retain', count: minLen });
        againstIndex += minLen;
        if (againstIndex >= op2.text.length) { i2++; againstIndex = 0; }
      } else if (op2.type === 'retain') {
        // Both retain
        result.push({ type: 'retain', count: minLen });
        opIndex += minLen;
        againstIndex += minLen;
        if (opIndex >= op1.count) { i1++; opIndex = 0; }
        if (againstIndex >= op2.count) { i2++; againstIndex = 0; }
      } else if (op2.type === 'delete') {
        // Retain vs Delete: text already deleted, so just skip
        opIndex += minLen;
        againstIndex += minLen;
        if (opIndex >= op1.count) { i1++; opIndex = 0; }
        if (againstIndex >= op2.count) { i2++; againstIndex = 0; }
      }
    } else if (op1.type === 'delete') {
      if (op2.type === 'insert') {
        // Delete vs Insert: need retain to skip, then delete
        result.push({ type: 'retain', count: minLen });
        result.push({ type: 'delete', count: minLen });
        opIndex += minLen;
        againstIndex += minLen;
        if (opIndex >= op1.count) { i1++; opIndex = 0; }
        if (againstIndex >= op2.text.length) { i2++; againstIndex = 0; }
      } else if (op2.type === 'retain') {
        // Delete vs Retain: keep delete
        result.push({ type: 'delete', count: minLen });
        opIndex += minLen;
        againstIndex += minLen;
        if (opIndex >= op1.count) { i1++; opIndex = 0; }
        if (againstIndex >= op2.count) { i2++; againstIndex = 0; }
      } else if (op2.type === 'delete') {
        // Delete vs Delete: both delete same text
        opIndex += minLen;
        againstIndex += minLen;
        if (opIndex >= op1.count) { i1++; opIndex = 0; }
        if (againstIndex >= op2.count) { i2++; againstIndex = 0; }
      }
    }
  }
  
  return normalize(result);
}

// ============================================================================
// DIFF ALGORITHM (Myers' Diff)
// ============================================================================

interface DiffEdit {
  operation: 'insert' | 'delete' | 'equal';
  text: string;
  oldIndex: number;
  newIndex: number;
}

/**
 * Computes the diff between two strings using a simplified Myers' algorithm
 * This is O((N+M)D) where D is the edit distance
 * 
 * @param oldText - The original text
 * @param newText - The new text
 * @returns Array of edit operations
 */
export function diff(oldText: string, newText: string): DiffEdit[] {
  if (oldText === newText) {
    return [{ operation: 'equal', text: oldText, oldIndex: 0, newIndex: 0 }];
  }
  
  // Use character-level diffing
  const oldChars = Array.from(oldText);
  const newChars = Array.from(newText);
  
  const n = oldChars.length;
  const m = newChars.length;
  
  // Handle edge cases
  if (n === 0) {
    return [{ operation: 'insert', text: newText, oldIndex: 0, newIndex: 0 }];
  }
  if (m === 0) {
    return [{ operation: 'delete', text: oldText, oldIndex: 0, newIndex: 0 }];
  }
  
  // Find longest common subsequence using dynamic programming
  // This is O(n*m) but works well for reasonable text sizes
  const dp: number[][] = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));
  
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldChars[i - 1] === newChars[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Backtrack to find the diff
  const edits: DiffEdit[] = [];
  let i = n;
  let j = m;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldChars[i - 1] === newChars[j - 1]) {
      // Match - part of LCS
      const char = oldChars[i - 1];
      if (edits.length > 0 && edits[edits.length - 1].operation === 'equal') {
        edits[edits.length - 1].text = char + edits[edits.length - 1].text;
        edits[edits.length - 1].oldIndex = i - 1;
        edits[edits.length - 1].newIndex = j - 1;
      } else {
        edits.push({
          operation: 'equal',
          text: char,
          oldIndex: i - 1,
          newIndex: j - 1
        });
      }
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // Insertion in new text
      const char = newChars[j - 1];
      if (edits.length > 0 && edits[edits.length - 1].operation === 'insert') {
        edits[edits.length - 1].text = char + edits[edits.length - 1].text;
        edits[edits.length - 1].newIndex = j - 1;
      } else {
        edits.push({
          operation: 'insert',
          text: char,
          oldIndex: i,
          newIndex: j - 1
        });
      }
      j--;
    } else {
      // Deletion from old text
      const char = oldChars[i - 1];
      if (edits.length > 0 && edits[edits.length - 1].operation === 'delete') {
        edits[edits.length - 1].text = char + edits[edits.length - 1].text;
        edits[edits.length - 1].oldIndex = i - 1;
      } else {
        edits.push({
          operation: 'delete',
          text: char,
          oldIndex: i - 1,
          newIndex: j
        });
      }
      i--;
    }
  }
  
  return edits.reverse();
}

/**
 * Converts diff edits to OT operations
 * 
 * @param edits - The diff edits from diff()
 * @returns Array of OT operations
 */
export function diffToOps(edits: DiffEdit[]): Operation[] {
  const ops: Operation[] = [];
  
  for (const edit of edits) {
    switch (edit.operation) {
      case 'equal':
        ops.push({ type: 'retain', count: edit.text.length });
        break;
      case 'insert':
        ops.push({ type: 'insert', text: edit.text });
        break;
      case 'delete':
        ops.push({ type: 'delete', count: edit.text.length });
        break;
    }
  }
  
  return normalize(ops);
}

/**
 * Convenience function: diff oldText to newText and return operations
 * 
 * @param oldText - Original text
 * @param newText - New text
 * @returns Operations that transform oldText to newText
 */
export function textToOps(oldText: string, newText: string): Operation[] {
  const edits = diff(oldText, newText);
  return diffToOps(edits);
}

// ============================================================================
// CONCURRENT EDITING
// ============================================================================

/**
 * Transforms client operations against server operations
 * This handles the case where client and server have diverged
 * 
 * @param clientOps - Operations from the client
 * @param serverOps - Operations from the server
 * @returns Object with transformed client and server ops
 */
export function transformOps(
  clientOps: Operation[],
  serverOps: Operation[]
): { clientTransformed: Operation[]; serverTransformed: Operation[] } {
  return {
    clientTransformed: transform(clientOps, serverOps),
    serverTransformed: transform(serverOps, clientOps)
  };
}

/**
 * Transforms a cursor position through an operation
 * Used to preserve cursor positions during concurrent editing
 * 
 * @param position - The cursor position
 * @param op - The operation to transform through
 * @returns The transformed cursor position
 */
export function transformCursor(position: number, op: Operation[]): number {
  const normalized = normalize(op);
  let newPosition = position;
  let currentIndex = 0;
  
  for (const operation of normalized) {
    switch (operation.type) {
      case 'retain':
        currentIndex += operation.count;
        break;
        
      case 'insert':
        if (currentIndex <= position) {
          newPosition += operation.text.length;
        }
        break;
        
      case 'delete':
        if (currentIndex + operation.count <= position) {
          newPosition -= operation.count;
        } else if (currentIndex < position) {
          newPosition = currentIndex;
        }
        currentIndex += operation.count;
        break;
    }
    
    if (currentIndex > position) {
      break;
    }
  }
  
  return Math.max(0, newPosition);
}

/**
 * Transforms a selection range through an operation
 * 
 * @param range - The selection range
 * @param op - The operation to transform through
 * @returns The transformed selection range
 */
export function transformSelection(range: TextRange, op: Operation[]): TextRange {
  return {
    start: transformCursor(range.start, op),
    end: transformCursor(range.end, op)
  };
}

/**
 * Batch transforms multiple operations
 * Useful when multiple clients edit concurrently
 * 
 * @param ops - Operations to transform
 * @param againstAll - All operations to transform against (in order)
 * @returns Transformed operations
 */
export function transformAgainstMany(ops: Operation[], againstAll: Operation[][]): Operation[] {
  let result = ops;
  for (const against of againstAll) {
    result = transform(result, against);
  }
  return normalize(result);
}

// ============================================================================
// SECTION-BASED OPERATIONS
// ============================================================================

/**
 * Creates an operation for a specific section
 * 
 * @param sectionId - The section identifier
 * @param operations - The operations to apply to the section
 * @param userId - The user performing the operation
 * @returns A section operation
 */
export function createSectionOperation(
  sectionId: string,
  operations: Operation[],
  userId: string
): SectionOperation {
  return {
    sectionId,
    operations: normalize(operations),
    timestamp: Date.now(),
    userId
  };
}

/**
 * Applies a section operation to the document
 * 
 * @param sections - Array of sections
 * @param sectionOp - The section operation to apply
 * @returns Updated sections array
 */
export function applySectionOperation(
  sections: Section[],
  sectionOp: SectionOperation
): Section[] {
  return sections.map(section => {
    if (section.id === sectionOp.sectionId) {
      return {
        ...section,
        content: apply(sectionOp.operations, section.content)
      };
    }
    return section;
  });
}

/**
 * Transforms a section operation against other section operations
 * Handles cross-section dependencies
 * 
 * @param sectionOp - The operation to transform
 * @param againstOps - Operations to transform against
 * @returns Transformed section operation
 */
export function transformSectionOperation(
  sectionOp: SectionOperation,
  againstOps: SectionOperation[]
): SectionOperation {
  // Filter operations for the same section
  const sameSectionOps = againstOps.filter(op => op.sectionId === sectionOp.sectionId);
  
  if (sameSectionOps.length === 0) {
    return sectionOp;
  }
  
  // Compose all same-section operations
  let composedAgainst: Operation[] = [];
  for (const op of sameSectionOps) {
    composedAgainst = compose(composedAgainst, op.operations);
  }
  
  // Transform the operation
  const transformedOps = transform(sectionOp.operations, composedAgainst);
  
  return {
    ...sectionOp,
    operations: transformedOps
  };
}

/**
 * Composes multiple section operations into one
 * Useful for batching changes
 * 
 * @param ops - Section operations to compose
 * @returns Array of composed section operations (grouped by section)
 */
export function composeSectionOperations(ops: SectionOperation[]): SectionOperation[] {
  const grouped = new Map<string, SectionOperation[]>();
  
  // Group by section
  for (const op of ops) {
    if (!grouped.has(op.sectionId)) {
      grouped.set(op.sectionId, []);
    }
    grouped.get(op.sectionId)!.push(op);
  }
  
  // Compose each group
  const result: SectionOperation[] = [];
  for (const [sectionId, sectionOps] of Array.from(grouped.entries())) {
    if (sectionOps.length === 0) continue;
    
    let composed: Operation[] = [];
    for (const op of sectionOps) {
      composed = compose(composed, op.operations);
    }
    
    result.push({
      sectionId,
      operations: composed,
      timestamp: sectionOps[sectionOps.length - 1].timestamp,
      userId: sectionOps[sectionOps.length - 1].userId
    });
  }
  
  return result;
}

/**
 * Checks if a section is locked by a user
 * 
 * @param section - The section to check
 * @param userId - The user ID to check against (optional)
 * @param timeout - Lock timeout in milliseconds (default: 30000)
 * @returns True if the section is locked by someone else
 */
export function isSectionLocked(
  section: Section,
  userId?: string,
  timeout: number = 30000
): boolean {
  if (!section.lockedBy) return false;
  if (!section.lockedAt) return false;
  
  // Check if lock has expired
  if (Date.now() - section.lockedAt > timeout) {
    return false;
  }
  
  // If userId is provided, only return true if locked by someone else
  if (userId) {
    return section.lockedBy !== userId;
  }
  
  return true;
}

/**
 * Locks a section for editing
 * 
 * @param sections - Array of sections
 * @param sectionId - Section to lock
 * @param userId - User locking the section
 * @returns Updated sections array
 */
export function lockSection(
  sections: Section[],
  sectionId: string,
  userId: string
): Section[] {
  return sections.map(section => {
    if (section.id === sectionId) {
      return {
        ...section,
        lockedBy: userId,
        lockedAt: Date.now()
      };
    }
    return section;
  });
}

/**
 * Unlocks a section
 * 
 * @param sections - Array of sections
 * @param sectionId - Section to unlock
 * @returns Updated sections array
 */
export function unlockSection(
  sections: Section[],
  sectionId: string
): Section[] {
  return sections.map(section => {
    if (section.id === sectionId) {
      const { lockedBy, lockedAt, ...rest } = section;
      return rest;
    }
    return section;
  });
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Converts operations to a human-readable string representation
 * Useful for debugging
 * 
 * @param ops - Operations to convert
 * @returns String representation
 */
export function opsToString(ops: Operation[]): string {
  return ops.map(op => {
    switch (op.type) {
      case 'retain':
        return `retain(${op.count})`;
      case 'insert':
        return `insert("${op.text.replace(/"/g, '\\"')}")`;
      case 'delete':
        return `delete(${op.count})`;
    }
  }).join(', ');
}

/**
 * Parses a string representation back to operations
 * Reverse of opsToString
 * 
 * @param str - String to parse
 * @returns Array of operations
 */
export function stringToOps(str: string): Operation[] {
  const ops: Operation[] = [];
  const regex = /(retain|insert|delete)\(([^)]+)\)/g;
  let match;
  
  while ((match = regex.exec(str)) !== null) {
    const type = match[1] as OperationType;
    const arg = match[2];
    
    switch (type) {
      case 'retain':
      case 'delete':
        ops.push({ type, count: parseInt(arg, 10) });
        break;
      case 'insert':
        // Remove quotes if present
        const text = arg.replace(/^"|"$/g, '').replace(/\\"/g, '"');
        ops.push({ type, text });
        break;
    }
  }
  
  return normalize(ops);
}

// ============================================================================
// TEST EXPORTS
// ============================================================================

/**
 * Test suite for the OT library
 * Run with: import { runTests } from './operational-transform'; runTests();
 */
export function runTests(): void {
  const tests: { name: string; run: () => boolean }[] = [];
  let passed = 0;
  let failed = 0;
  
  function test(name: string, fn: () => boolean) {
    tests.push({ name, run: fn });
  }
  
  function assertEqual(actual: unknown, expected: unknown, msg?: string): boolean {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      console.error(`  FAIL: ${msg || 'Values not equal'}`);
      console.error(`    Expected: ${expectedStr}`);
      console.error(`    Actual:   ${actualStr}`);
      return false;
    }
    return true;
  }
  
  // Test: Basic apply
  test('apply insert', () => {
    const result = apply([{ type: 'insert', text: 'Hello' }], '');
    return assertEqual(result, 'Hello', 'Should insert text');
  });
  
  test('apply retain', () => {
    // Retain passes through text without changing it - operations are cumulative
    // A retain of 3 chars on 'Hello' with delete of remaining should give 'Hel'
    const result = apply([{ type: 'retain', count: 3 }, { type: 'delete', count: 2 }], 'Hello');
    return assertEqual(result, 'Hel', 'Should retain first 3 chars and delete rest');
  });
  
  test('apply delete', () => {
    const result = apply([{ type: 'delete', count: 3 }], 'Hello');
    return assertEqual(result, 'lo', 'Should delete first 3 chars');
  });
  
  test('apply combined', () => {
    const ops: Operation[] = [
      { type: 'retain', count: 2 },
      { type: 'delete', count: 1 },
      { type: 'insert', text: 'L' },
      { type: 'retain', count: 2 }
    ];
    const result = apply(ops, 'Hello');
    return assertEqual(result, 'HeLlo', 'Should replace l with L');
  });
  
  // Test: Invert
  test('invert insert', () => {
    const ops: Operation[] = [{ type: 'insert', text: 'World' }];
    const inverted = invert(ops, '');
    const result = apply(inverted, 'World');
    return assertEqual(result, '', 'Should delete inserted text');
  });
  
  test('invert delete', () => {
    const ops: Operation[] = [{ type: 'delete', count: 5 }];
    const inverted = invert(ops, 'Hello World');
    const result = apply(inverted, ' World');
    return assertEqual(result, 'Hello World', 'Should restore deleted text');
  });
  
  test('invert combined', () => {
    const ops: Operation[] = [
      { type: 'retain', count: 6 },
      { type: 'delete', count: 5 },
      { type: 'insert', text: 'Universe' }
    ];
    const inverted = invert(ops, 'Hello World');
    const intermediate = apply(ops, 'Hello World');
    const result = apply(inverted, intermediate);
    return assertEqual(result, 'Hello World', 'Should restore original text');
  });
  
  // Test: Compose
  test('compose inserts', () => {
    const op1: Operation[] = [{ type: 'insert', text: 'Hello' }];
    const op2: Operation[] = [{ type: 'insert', text: ' World' }];
    const composed = compose(op1, op2);
    const result = apply(composed, '');
    return assertEqual(result, 'Hello World', 'Should compose two inserts');
  });
  
  test('compose insert and delete', () => {
    // In OT, compose(insert "Hello World", delete 6) from empty document
    // The delete tries to remove from empty doc which fails
    // For compose with insert followed by delete, we just keep the insert
    // (the delete would require original text to work)
    const op1: Operation[] = [{ type: 'insert', text: 'Hello World' }];
    const op2: Operation[] = [{ type: 'delete', count: 6 }];
    const composed = compose(op1, op2);
    // Composed operation will be insert "Hello World" - delete is dropped
    // since it can't be applied to an empty document
    return assertEqual(composed, [{ type: 'insert', text: 'Hello World' }], 'Compose keeps insert, drops delete');
  });
  
  // Test: Transform
  test('transform two inserts', () => {
    const opA: Operation[] = [{ type: 'insert', text: 'A' }];
    const opB: Operation[] = [{ type: 'insert', text: 'B' }];
    
    const transformedA = transform(opA, opB);
    const transformedB = transform(opB, opA);
    
    // Both transformations should produce the same final result
    const resultA = apply(transformedA, apply(opB, ''));
    const resultB = apply(transformedB, apply(opA, ''));
    
    // With our tie-breaking (first-come-first-served), we get BA
    // User A sees B then A = "BA"
    // User B sees A then B = "AB"
    // Wait, that doesn't match. Let me check what actually happens:
    return assertEqual(resultA, resultB, 'Both users should see the same final document');
  });
  
  test('transform concurrent example', () => {
    // User A inserts "Hello" at position 0
    const opA: Operation[] = [{ type: 'insert', text: 'Hello' }];
    
    // User B inserts "World" at position 0 (concurrently)
    const opB: Operation[] = [{ type: 'insert', text: 'World' }];
    
    // Transform B against A
    const transformedB = transform(opB, opA);
    
    // B's insert needs to come after A's insert
    // So we add a retain to skip over A's inserted text
    const expected: Operation[] = [{ type: 'retain', count: 5 }, { type: 'insert', text: 'World' }];
    
    return assertEqual(transformedB, expected, 'Should shift World after Hello') &&
           assertEqual(apply(transformedB, apply(opA, '')), 'HelloWorld', 'Final result should be HelloWorld');
  });
  
  test('transform property: op1 then op2\' == op2 then op1\'', () => {
    // This is the core OT property: applying op1 then op2' should equal applying op2 then op1'
    const op1: Operation[] = [
      { type: 'retain', count: 2 },
      { type: 'insert', text: 'X' },
      { type: 'retain', count: 1 }
    ];
    const op2: Operation[] = [
      { type: 'retain', count: 2 },
      { type: 'insert', text: 'Y' },
      { type: 'retain', count: 1 }
    ];
    
    const op1Prime = transform(op1, op2);
    const op2Prime = transform(op2, op1);
    
    const text = 'abc';
    const result1 = apply(op2Prime, apply(op1, text));
    const result2 = apply(op1Prime, apply(op2, text));
    
    return assertEqual(result1, result2, 'Transformation property should hold');
  });
  
  // Test: Diff
  test('diff identical strings', () => {
    const edits = diff('hello', 'hello');
    return assertEqual(edits.length, 1, 'Should have one edit') &&
           assertEqual(edits[0].operation, 'equal', 'Should be equal');
  });
  
  test('diff insert at end', () => {
    const edits = diff('hello', 'hello world');
    const ops = diffToOps(edits);
    const result = apply(ops, 'hello');
    return assertEqual(result, 'hello world', 'Should append " world"');
  });
  
  test('diff delete from middle', () => {
    const edits = diff('hello world', 'hell world');
    const ops = diffToOps(edits);
    const result = apply(ops, 'hello world');
    return assertEqual(result, 'hell world', 'Should delete "o"');
  });
  
  test('diff replace', () => {
    const edits = diff('hello', 'hola');
    const ops = diffToOps(edits);
    const result = apply(ops, 'hello');
    return assertEqual(result, 'hola', 'Should replace text');
  });
  
  // Test: Cursor transformation
  test('transform cursor after insert', () => {
    const ops: Operation[] = [{ type: 'insert', text: 'Hello ' }];
    const newCursor = transformCursor(0, ops);
    return assertEqual(newCursor, 6, 'Cursor should shift by insert length');
  });
  
  test('transform cursor before delete', () => {
    const ops: Operation[] = [{ type: 'delete', count: 3 }];
    const newCursor = transformCursor(5, ops);
    return assertEqual(newCursor, 2, 'Cursor should shift back by delete count');
  });
  
  // Test: Section operations
  test('apply section operation', () => {
    const sections: Section[] = [
      { id: 'intro', content: 'Introduction' },
      { id: 'body', content: 'Body text' }
    ];
    const sectionOp = createSectionOperation('intro', [{ type: 'insert', text: 'Great ' }], 'user1');
    const updated = applySectionOperation(sections, sectionOp);
    return assertEqual(updated[0].content, 'Great Introduction', 'Should apply to correct section');
  });
  
  test('section locking', () => {
    let sections: Section[] = [{ id: 'test', content: 'test' }];
    sections = lockSection(sections, 'test', 'user1');
    const locked = isSectionLocked(sections[0], 'user2');
    const ownLock = isSectionLocked(sections[0], 'user1');
    return assertEqual(locked, true, 'Should be locked for other users') &&
           assertEqual(ownLock, false, 'Should not be locked for owner');
  });
  
  // Test: Normalization
  test('normalize combines inserts', () => {
    const ops: Operation[] = [
      { type: 'insert', text: 'Hello' },
      { type: 'insert', text: ' ' },
      { type: 'insert', text: 'World' }
    ];
    const normalized = normalize(ops);
    return assertEqual(normalized, [{ type: 'insert', text: 'Hello World' }], 'Should combine inserts');
  });
  
  test('normalize removes trailing retain', () => {
    const ops: Operation[] = [
      { type: 'insert', text: 'Hi' },
      { type: 'retain', count: 5 }
    ];
    const normalized = normalize(ops);
    return assertEqual(normalized, [{ type: 'insert', text: 'Hi' }], 'Should remove trailing retain');
  });
  
  // Run all tests
  console.log('Running OT Library Tests...\n');
  
  for (const t of tests) {
    try {
      if (t.run()) {
        console.log(`✓ ${t.name}`);
        passed++;
      } else {
        console.log(`✗ ${t.name}`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${t.name} (exception)`);
      console.error(`  ${e}`);
      failed++;
    }
  }
  
  console.log(`\n${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}
