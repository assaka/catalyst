/**
 * PostgreSQLQueryBuilder - Query builder for PostgreSQL databases
 *
 * Provides the same interface as SupabaseQueryBuilder but uses node-postgres (pg)
 * This allows routes to work with both Supabase and raw PostgreSQL databases
 */

class PostgreSQLQueryBuilder {
  constructor(table, pool) {
    this.table = table;
    this.pool = pool;
    this._select = '*';
    this._where = [];
    this._orderBy = [];
    this._limitValue = null;
    this._offsetValue = null;
    this._insertData = null;
    this._updateData = null;
    this._deleteFlag = false;
    this._params = [];
  }

  // SELECT
  select(columns = '*', options = {}) {
    this._select = columns;
    this._countFlag = options.count === 'exact';
    return this;
  }

  // FILTERING
  eq(column, value) {
    this._params.push(value);
    this._where.push(`${column} = $${this._params.length}`);
    return this;
  }

  neq(column, value) {
    this._params.push(value);
    this._where.push(`${column} != $${this._params.length}`);
    return this;
  }

  gt(column, value) {
    this._params.push(value);
    this._where.push(`${column} > $${this._params.length}`);
    return this;
  }

  gte(column, value) {
    this._params.push(value);
    this._where.push(`${column} >= $${this._params.length}`);
    return this;
  }

  lt(column, value) {
    this._params.push(value);
    this._where.push(`${column} < $${this._params.length}`);
    return this;
  }

  lte(column, value) {
    this._params.push(value);
    this._where.push(`${column} <= $${this._params.length}`);
    return this;
  }

  like(column, pattern) {
    this._params.push(pattern);
    this._where.push(`${column} LIKE $${this._params.length}`);
    return this;
  }

  ilike(column, pattern) {
    this._params.push(pattern);
    this._where.push(`${column} ILIKE $${this._params.length}`);
    return this;
  }

  in(column, values) {
    if (!Array.isArray(values) || values.length === 0) {
      this._where.push('1=0'); // No matches
      return this;
    }
    const placeholders = values.map(v => {
      this._params.push(v);
      return `$${this._params.length}`;
    }).join(', ');
    this._where.push(`${column} IN (${placeholders})`);
    return this;
  }

  is(column, value) {
    if (value === null) {
      this._where.push(`${column} IS NULL`);
    } else {
      this._params.push(value);
      this._where.push(`${column} IS $${this._params.length}`);
    }
    return this;
  }

  or(filters) {
    // Parse Supabase-style OR filter: "col1.eq.val1,col2.eq.val2"
    const orClauses = filters.split(',').map(filter => {
      const match = filter.match(/(\w+)\.(eq|neq|gt|gte|lt|lte|like|ilike)\.(.+)/);
      if (!match) return null;

      const [, column, operator, value] = match;
      this._params.push(value);
      const paramNum = this._params.length;

      const ops = {
        eq: '=',
        neq: '!=',
        gt: '>',
        gte: '>=',
        lt: '<',
        lte: '<=',
        like: 'LIKE',
        ilike: 'ILIKE'
      };

      return `${column} ${ops[operator]} $${paramNum}`;
    }).filter(Boolean);

    if (orClauses.length > 0) {
      this._where.push(`(${orClauses.join(' OR ')})`);
    }
    return this;
  }

  // ORDERING
  order(column, options = { ascending: true }) {
    const direction = options.ascending ? 'ASC' : 'DESC';
    this._orderBy.push(`${column} ${direction}`);
    return this;
  }

  // PAGINATION
  range(from, to) {
    this._limitValue = to - from + 1;
    this._offsetValue = from;
    return this;
  }

  limit(count) {
    this._limitValue = count;
    return this;
  }

  // INSERT
  insert(data, options = {}) {
    this._insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  // UPDATE
  update(data, options = {}) {
    this._updateData = data;
    return this;
  }

  // UPSERT
  upsert(data, options = {}) {
    this._insertData = Array.isArray(data) ? data : [data];
    this._upsertConflict = options.onConflict;
    return this;
  }

  // DELETE
  delete(options = {}) {
    this._deleteFlag = true;
    return this;
  }

  // Build SQL query
  _buildQuery() {
    let sql;

    if (this._insertData) {
      // INSERT query
      const rows = this._insertData;
      const columns = Object.keys(rows[0]);
      const values = [];
      const valuePlaceholders = [];

      rows.forEach((row, rowIndex) => {
        const rowPlaceholders = columns.map((col, colIndex) => {
          values.push(row[col]);
          return `$${values.length}`;
        });
        valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
      });

      sql = `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES ${valuePlaceholders.join(', ')}`;

      if (this._upsertConflict) {
        sql += ` ON CONFLICT (${this._upsertConflict}) DO UPDATE SET `;
        sql += columns.map(col => `${col} = EXCLUDED.${col}`).join(', ');
      }

      sql += ' RETURNING *';
      this._params = values;

    } else if (this._updateData) {
      // UPDATE query
      const setClauses = Object.entries(this._updateData).map(([key, value]) => {
        this._params.push(value);
        return `${key} = $${this._params.length}`;
      });

      sql = `UPDATE ${this.table} SET ${setClauses.join(', ')}`;
      if (this._where.length > 0) {
        sql += ` WHERE ${this._where.join(' AND ')}`;
      }
      sql += ' RETURNING *';

    } else if (this._deleteFlag) {
      // DELETE query
      sql = `DELETE FROM ${this.table}`;
      if (this._where.length > 0) {
        sql += ` WHERE ${this._where.join(' AND ')}`;
      }
      sql += ' RETURNING *';

    } else {
      // SELECT query
      sql = `SELECT ${this._select} FROM ${this.table}`;

      if (this._where.length > 0) {
        sql += ` WHERE ${this._where.join(' AND ')}`;
      }

      if (this._orderBy.length > 0) {
        sql += ` ORDER BY ${this._orderBy.join(', ')}`;
      }

      if (this._limitValue !== null) {
        sql += ` LIMIT ${this._limitValue}`;
      }

      if (this._offsetValue !== null) {
        sql += ` OFFSET ${this._offsetValue}`;
      }
    }

    return sql;
  }

  // EXECUTION
  async single() {
    const sql = this._buildQuery();
    const result = await this.pool.query(sql, this._params);

    return {
      data: result.rows[0] || null,
      error: null,
      count: result.rowCount
    };
  }

  async maybeSingle() {
    const sql = this._buildQuery();
    const result = await this.pool.query(sql, this._params);

    return {
      data: result.rows[0] || null,
      error: null,
      count: result.rowCount
    };
  }

  async execute() {
    const sql = this._buildQuery();
    const result = await this.pool.query(sql, this._params);

    let count = result.rowCount;

    // If count flag is set, get total count
    if (this._countFlag && !this._insertData && !this._updateData && !this._deleteFlag) {
      const countSql = `SELECT COUNT(*) as count FROM ${this.table}` +
        (this._where.length > 0 ? ` WHERE ${this._where.join(' AND ')}` : '');
      const countResult = await this.pool.query(countSql, this._params);
      count = parseInt(countResult.rows[0].count);
    }

    return {
      data: result.rows,
      error: null,
      count
    };
  }

  // Alias for execute (for compatibility with promises)
  async then(resolve, reject) {
    try {
      const result = await this.execute();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }
}

module.exports = PostgreSQLQueryBuilder;
