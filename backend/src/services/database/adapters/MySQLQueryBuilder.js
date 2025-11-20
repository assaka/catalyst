/**
 * MySQLQueryBuilder - Query builder for MySQL databases
 *
 * Provides the same interface as SupabaseQueryBuilder but uses mysql2
 * This allows routes to work with Supabase, PostgreSQL, and MySQL databases
 */

class MySQLQueryBuilder {
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
    this._where.push(`${column} = ?`);
    return this;
  }

  neq(column, value) {
    this._params.push(value);
    this._where.push(`${column} != ?`);
    return this;
  }

  gt(column, value) {
    this._params.push(value);
    this._where.push(`${column} > ?`);
    return this;
  }

  gte(column, value) {
    this._params.push(value);
    this._where.push(`${column} >= ?`);
    return this;
  }

  lt(column, value) {
    this._params.push(value);
    this._where.push(`${column} < ?`);
    return this;
  }

  lte(column, value) {
    this._params.push(value);
    this._where.push(`${column} <= ?`);
    return this;
  }

  like(column, pattern) {
    this._params.push(pattern);
    this._where.push(`${column} LIKE ?`);
    return this;
  }

  ilike(column, pattern) {
    // MySQL LIKE is case-insensitive by default with utf8_general_ci collation
    // For case-insensitive search, use LOWER()
    this._params.push(pattern.toLowerCase());
    this._where.push(`LOWER(${column}) LIKE ?`);
    return this;
  }

  in(column, values) {
    if (!Array.isArray(values) || values.length === 0) {
      this._where.push('1=0'); // No matches
      return this;
    }
    const placeholders = values.map(() => '?').join(', ');
    this._params.push(...values);
    this._where.push(`${column} IN (${placeholders})`);
    return this;
  }

  is(column, value) {
    if (value === null) {
      this._where.push(`${column} IS NULL`);
    } else {
      this._params.push(value);
      this._where.push(`${column} IS ?`);
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

      const ops = {
        eq: '=',
        neq: '!=',
        gt: '>',
        gte: '>=',
        lt: '<',
        lte: '<=',
        like: 'LIKE',
        ilike: 'LIKE' // MySQL doesn't have ILIKE
      };

      return `${column} ${ops[operator]} ?`;
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

      rows.forEach((row) => {
        const rowPlaceholders = columns.map((col) => {
          values.push(row[col]);
          return '?';
        });
        valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
      });

      sql = `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES ${valuePlaceholders.join(', ')}`;

      if (this._upsertConflict) {
        // MySQL uses ON DUPLICATE KEY UPDATE
        const updateClauses = columns.map(col => `${col} = VALUES(${col})`).join(', ');
        sql += ` ON DUPLICATE KEY UPDATE ${updateClauses}`;
      }

      this._params = values;

    } else if (this._updateData) {
      // UPDATE query
      const setClauses = Object.entries(this._updateData).map(([key, value]) => {
        this._params.push(value);
        return `${key} = ?`;
      });

      sql = `UPDATE ${this.table} SET ${setClauses.join(', ')}`;
      if (this._where.length > 0) {
        sql += ` WHERE ${this._where.join(' AND ')}`;
      }

    } else if (this._deleteFlag) {
      // DELETE query
      sql = `DELETE FROM ${this.table}`;
      if (this._where.length > 0) {
        sql += ` WHERE ${this._where.join(' AND ')}`;
      }

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
    const [rows] = await this.pool.query(sql, this._params);

    return {
      data: rows[0] || null,
      error: null,
      count: rows.length
    };
  }

  async maybeSingle() {
    const sql = this._buildQuery();
    const [rows] = await this.pool.query(sql, this._params);

    return {
      data: rows[0] || null,
      error: null,
      count: rows.length
    };
  }

  async execute() {
    const sql = this._buildQuery();
    const [rows, fields] = await this.pool.query(sql, this._params);

    let count = rows.affectedRows || rows.length;

    // If count flag is set, get total count
    if (this._countFlag && !this._insertData && !this._updateData && !this._deleteFlag) {
      const countSql = `SELECT COUNT(*) as count FROM ${this.table}` +
        (this._where.length > 0 ? ` WHERE ${this._where.join(' AND ')}` : '');
      const [countRows] = await this.pool.query(countSql, this._params);
      count = parseInt(countRows[0].count);
    }

    return {
      data: Array.isArray(rows) ? rows : [rows],
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

module.exports = MySQLQueryBuilder;
