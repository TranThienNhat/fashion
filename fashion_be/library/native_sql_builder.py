"""
NativeSqlBuilder for Python / MySQL
Provides a fluent, safe API for building dynamic parameterized native SQL queries
supporting SELECT, INSERT, UPDATE, and DELETE operations.
"""

import re
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple, Union


class LikeMatch(Enum):
    PREFIX = "PREFIX"      # value%
    SUFFIX = "SUFFIX"      # %value
    CONTAINS = "CONTAINS"  # %value%
    EXACT = "EXACT"        # value


SAFE_IDENTIFIER = re.compile(r"^[a-zA-Z0-9_.]+$")


def validate_identifier(s: str) -> None:
    if s and not SAFE_IDENTIFIER.match(s.strip()):
        raise ValueError(f"SQL Injection warning! Invalid identifier: {s}")


def clean_leading_keyword(sql: str, keyword: str) -> str:
    if not sql:
        return ""
    trimmed = sql.lstrip()
    if trimmed.upper().startswith(keyword.upper()):
        after = trimmed[len(keyword):]
        if not after or after[0].isspace():
            return after.lstrip()
    return trimmed


def is_single_identifier(s: str) -> bool:
    return bool(s and " " not in s and "\n" not in s and "\t" not in s)


def extract_default_alias(from_clause: str) -> Optional[str]:
    if not from_clause or not from_clause.strip():
        return None
    s = re.sub(r"/\*.*?\*/", "", from_clause).strip()
    first_part = re.split(r"(?i)\b(JOIN|LEFT|RIGHT|INNER|FULL|CROSS|WHERE|,)\b", s)[0].strip()
    if "\n" in first_part:
        first_part = first_part.split("\n")[0].strip()
    tokens = first_part.split()
    if len(tokens) == 2:
        return tokens[1].strip()
    elif len(tokens) >= 3 and tokens[-2].upper() == "AS":
        return tokens[-1].strip()
    return None


def is_not_empty(val: Any) -> bool:
    if val is None:
        return False
    if isinstance(val, str) and not val.strip():
        return False
    if isinstance(val, (list, tuple, set, dict)) and len(val) == 0:
        return False
    return True


class ConditionGroup:
    def __init__(self, operator: str, builder: "NativeSqlBuilder"):
        self.operator = operator
        self.builder = builder
        self.conditions: List[Union[str, "ConditionGroup"]] = []

    def where(self, *args, **kwargs) -> "ConditionGroup":
        """
        Flexible where condition:
        - where(alias, column, op, value)
        - where(column, value, op="=", alias=None)
        - where(column=col, value=val, operator=op, alias=al)
        """
        alias = None
        col = None
        op = "="
        val = None

        if len(args) == 4:
            a0, a1, a2, a3 = args
            operators = {"=", "!=", "<>", "<", ">", "<=", ">=", "LIKE", "NOT LIKE", "IS", "IS NOT", "IN"}
            if str(a2).upper() in operators:
                if not isinstance(a1, str):
                    alias, col, op, val = a3, a0, a2, a1
                else:
                    known_aliases = set()
                    if self.builder and getattr(self.builder, "_default_alias", None):
                        known_aliases.add(str(self.builder._default_alias).strip())
                    if self.builder and getattr(self.builder, "_join_clauses", None):
                        for j in self.builder._join_clauses:
                            parts = j.strip().split()
                            if len(parts) >= 3:
                                known_aliases.add(parts[2].strip())
                    if str(a3).strip() in known_aliases:
                        alias, col, op, val = a3, a0, a2, a1
                    elif str(a0).strip() in known_aliases:
                        alias, col, op, val = a0, a1, a2, a3
                    elif len(str(a3).strip()) <= 3 and len(str(a0).strip()) > 3:
                        alias, col, op, val = a3, a0, a2, a1
                    else:
                        alias, col, op, val = a0, a1, a2, a3
            else:
                alias, col, op, val = a0, a1, a2, a3
        elif len(args) == 3:
            col, val, op = args
        elif len(args) == 2:
            col, val = args
        elif len(args) == 1:
            col = args[0]
            val = kwargs.get("value")
            op = kwargs.get("operator", kwargs.get("op", "="))
            alias = kwargs.get("alias")
        else:
            col = kwargs.get("column")
            val = kwargs.get("value")
            op = kwargs.get("operator", kwargs.get("op", "="))
            alias = kwargs.get("alias")

        if is_not_empty(val):
            p = self.builder.register_param(val)
            resolved_col = self.builder.resolve_column(alias, col)
            self.conditions.append(f"{resolved_col} {op} %({p})s")
        return self

    def where_like(self, alias: Optional[str], column: str, value: Optional[str], match: LikeMatch = LikeMatch.CONTAINS) -> "ConditionGroup":
        if value is not None and str(value).strip():
            val_str = str(value).strip()
            if match == LikeMatch.PREFIX:
                pattern = f"{val_str}%"
            elif match == LikeMatch.SUFFIX:
                pattern = f"%{val_str}"
            elif match == LikeMatch.CONTAINS:
                pattern = f"%{val_str}%"
            else:
                pattern = val_str
            p = self.builder.register_param(pattern)
            col = self.builder.resolve_column(alias, column)
            self.conditions.append(f"{col} LIKE %({p})s")
        return self

    def where_in(self, alias: Optional[str], column: str, values: Optional[Union[List, Tuple, set]]) -> "ConditionGroup":
        if values is not None and len(values) > 0:
            val_list = list(values)
            param_names = []
            for item in val_list:
                p = self.builder.register_param(item)
                param_names.append(f"%({p})s")
            col = self.builder.resolve_column(alias, column)
            self.conditions.append(f"{col} IN ({', '.join(param_names)})")
        return self

    def where_between(self, alias: Optional[str], column: str, from_val: Any, to_val: Any) -> "ConditionGroup":
        has_from = is_not_empty(from_val)
        has_to = is_not_empty(to_val)
        col = self.builder.resolve_column(alias, column)
        if has_from and has_to:
            p1 = self.builder.register_param(from_val)
            p2 = self.builder.register_param(to_val)
            self.conditions.append(f"{col} BETWEEN %({p1})s AND %({p2})s")
        elif has_from:
            p1 = self.builder.register_param(from_val)
            self.conditions.append(f"{col} >= %({p1})s")
        elif has_to:
            p2 = self.builder.register_param(to_val)
            self.conditions.append(f"{col} <= %({p2})s")
        return self

    def where_null(self, alias: Optional[str], column: str) -> "ConditionGroup":
        col = self.builder.resolve_column(alias, column)
        self.conditions.append(f"{col} IS NULL")
        return self

    def where_not_null(self, alias: Optional[str], column: str) -> "ConditionGroup":
        col = self.builder.resolve_column(alias, column)
        self.conditions.append(f"{col} IS NOT NULL")
        return self

    def where_exists(self, sub_query_sql: str) -> "ConditionGroup":
        if sub_query_sql and sub_query_sql.strip():
            self.conditions.append(f"EXISTS ({sub_query_sql.strip()})")
        return self

    def where_not_exists(self, sub_query_sql: str) -> "ConditionGroup":
        if sub_query_sql and sub_query_sql.strip():
            self.conditions.append(f"NOT EXISTS ({sub_query_sql.strip()})")
        return self

    def where_raw(self, raw_cond: str) -> "ConditionGroup":
        if raw_cond and raw_cond.strip():
            self.conditions.append(raw_cond.strip())
        return self

    def add_group(self, group: "ConditionGroup") -> "ConditionGroup":
        if not group.is_empty():
            self.conditions.append(group)
        return self

    def is_empty(self) -> bool:
        return len(self.conditions) == 0

    def render(self) -> str:
        if not self.conditions:
            return ""
        parts = []
        for cond in self.conditions:
            if isinstance(cond, str):
                parts.append(cond)
            elif isinstance(cond, ConditionGroup):
                sub = cond.render()
                if sub:
                    parts.append(f"({sub})")
        op = f" {self.operator} "
        return op.join(parts)


class NativeSqlBuilder:
    """
    Fluent builder for native SQL queries: SELECT, INSERT, UPDATE, and DELETE.
    """

    def __init__(self, shared_counter: Optional[List[int]] = None, shared_params: Optional[Dict[str, Any]] = None):
        self._param_counter = shared_counter if shared_counter is not None else [0]
        self._parameters: Dict[str, Any] = shared_params if shared_params is not None else {}
        self._operation: str = "SELECT"  # "SELECT", "INSERT", "UPDATE", "DELETE"
        
        # SELECT attributes
        self._distinct = False
        self._select_clauses: List[str] = []
        self._from_clause: Optional[str] = None
        self._default_alias: Optional[str] = None
        self._join_clauses: List[str] = []
        self._ctes: List[str] = []
        self._unions: List[Tuple[str, "NativeSqlBuilder"]] = []
        self._group_by_clause: Optional[str] = None
        self._having_clause: Optional[str] = None
        self._order_by_clause: Optional[str] = None
        self._limit: Optional[int] = None
        self._offset: Optional[int] = None

        # Common WHERE
        self._root_where = ConditionGroup("AND", self)

        # INSERT / UPDATE attributes
        self._target_table: Optional[str] = None
        self._insert_ignore: bool = False
        self._set_clauses: List[str] = []
        self._insert_columns: List[str] = []
        self._insert_param_names: List[str] = []

    @classmethod
    def create(cls) -> "NativeSqlBuilder":
        return cls()

    @classmethod
    def insert(cls, table: str, values_dict: Optional[Dict[str, Any]] = None) -> "NativeSqlBuilder":
        builder = cls().insert_into(table)
        if values_dict:
            builder.values(values_dict)
        return builder

    @classmethod
    def update_table(cls, table: str, set_data: Optional[Dict[str, Any]] = None, alias: Optional[str] = None) -> "NativeSqlBuilder":
        builder = cls().update(table, alias)
        if set_data:
            builder.set(set_data)
        return builder

    @classmethod
    def delete(cls, table: str, alias: Optional[str] = None) -> "NativeSqlBuilder":
        return cls().delete_from(table, alias)

    # =========================================================================
    # INSERT OPERATIONS
    # =========================================================================
    def insert_into(self, table: str) -> "NativeSqlBuilder":
        self._operation = "INSERT"
        self._target_table = table.strip()
        return self

    def ignore(self, is_ignore: bool = True) -> "NativeSqlBuilder":
        self._insert_ignore = is_ignore
        return self

    def values(self, data: Dict[str, Any]) -> "NativeSqlBuilder":
        """Bind a dictionary of column -> value for INSERT."""
        self._operation = "INSERT"
        for col, val in data.items():
            validate_identifier(col)
            p = self.register_param(val)
            self._insert_columns.append(col)
            self._insert_param_names.append(f"%({p})s")
        return self

    def build_insert_sql(self) -> str:
        if not self._target_table:
            raise ValueError("Target table must be specified for INSERT statement")
        if not self._insert_columns:
            raise ValueError("No values specified for INSERT statement")

        keyword = "INSERT IGNORE INTO" if self._insert_ignore else "INSERT INTO"
        cols = ", ".join(f"`{col}`" if not col.startswith("`") else col for col in self._insert_columns)
        vals = ", ".join(self._insert_param_names)
        return f"{keyword} {self._target_table} ({cols})\nVALUES ({vals})\n"

    def execute_insert(self, cursor) -> int:
        sql = self.build_insert_sql()
        cursor.execute(sql, self._parameters)
        return cursor.lastrowid

    # =========================================================================
    # UPDATE OPERATIONS
    # =========================================================================
    def update(self, table: str, alias: Optional[str] = None) -> "NativeSqlBuilder":
        self._operation = "UPDATE"
        clean = table.strip()
        self._target_table = f"{clean} {alias.strip()}" if alias else clean
        self._default_alias = alias
        return self

    def set(self, data: Dict[str, Any]) -> "NativeSqlBuilder":
        """Bind key-values for UPDATE SET clause."""
        self._operation = "UPDATE"
        for col, val in data.items():
            validate_identifier(col)
            p = self.register_param(val)
            self._set_clauses.append(f"`{col}` = %({p})s" if not col.startswith("`") else f"{col} = %({p})s")
        return self

    def set_col(self, column: str, value: Any) -> "NativeSqlBuilder":
        self._operation = "UPDATE"
        validate_identifier(column)
        p = self.register_param(value)
        self._set_clauses.append(f"`{column}` = %({p})s" if not column.startswith("`") else f"{column} = %({p})s")
        return self

    def set_expr(self, column: str, expr_sql: str, param_val: Any = None) -> "NativeSqlBuilder":
        """Set a column to an expression, e.g. stock_quantity = stock_quantity - %s."""
        self._operation = "UPDATE"
        validate_identifier(column)
        if param_val is not None:
            p = self.register_param(param_val)
            rendered_expr = expr_sql.replace("%s", f"%({p})s")
            self._set_clauses.append(f"`{column}` = {rendered_expr}")
        else:
            self._set_clauses.append(f"`{column}` = {expr_sql}")
        return self

    def build_update_sql(self) -> str:
        if not self._target_table:
            raise ValueError("Target table must be specified for UPDATE statement")
        if not self._set_clauses:
            raise ValueError("No SET clauses specified for UPDATE statement")

        parts = [f"UPDATE {self._target_table}\nSET ", ",\n    ".join(self._set_clauses), "\n"]
        where_sql = self._root_where.render()
        if where_sql:
            parts.append(f"WHERE {where_sql}\n")
        return "".join(parts)

    def execute_update(self, cursor) -> int:
        sql = self.build_update_sql()
        cursor.execute(sql, self._parameters)
        return cursor.rowcount

    # =========================================================================
    # DELETE OPERATIONS
    # =========================================================================
    def delete_from(self, table: str, alias: Optional[str] = None) -> "NativeSqlBuilder":
        self._operation = "DELETE"
        clean = table.strip()
        self._target_table = f"{clean} {alias.strip()}" if alias else clean
        self._default_alias = alias
        return self

    def build_delete_sql(self) -> str:
        if not self._target_table:
            raise ValueError("Target table must be specified for DELETE statement")

        parts = [f"DELETE FROM {self._target_table}\n"]
        where_sql = self._root_where.render()
        if where_sql:
            parts.append(f"WHERE {where_sql}\n")
        return "".join(parts)

    def execute_delete(self, cursor) -> int:
        sql = self.build_delete_sql()
        cursor.execute(sql, self._parameters)
        return cursor.rowcount

    # =========================================================================
    # SELECT OPERATIONS
    # =========================================================================
    def with_cte(self, name: str, cte_sql: str) -> "NativeSqlBuilder":
        if cte_sql and cte_sql.strip():
            self._ctes.append(f"{name} AS (\n{cte_sql.strip()}\n)")
        return self

    def distinct(self, distinct: bool = True) -> "NativeSqlBuilder":
        self._distinct = distinct
        return self

    def select(self, *columns: str) -> "NativeSqlBuilder":
        self._operation = "SELECT"
        self._select_clauses.clear()
        for col in columns:
            self.add_select(col)
        return self

    def add_select(self, select_expr: str) -> "NativeSqlBuilder":
        if select_expr and select_expr.strip():
            self._select_clauses.append(clean_leading_keyword(select_expr.strip(), "SELECT"))
        return self

    def from_table(self, from_table_or_block: str, alias: Optional[str] = None) -> "NativeSqlBuilder":
        if from_table_or_block and from_table_or_block.strip():
            clean = clean_leading_keyword(from_table_or_block.strip(), "FROM")
            target_alias = alias or extract_default_alias(clean)
            if is_single_identifier(clean):
                self._from_clause = f"{clean} {target_alias.strip()}" if target_alias else clean
            else:
                self._from_clause = clean
            self._default_alias = target_alias
        return self

    def default_alias(self, alias: str) -> "NativeSqlBuilder":
        self._default_alias = alias
        return self

    def join(self, join_sql: str) -> "NativeSqlBuilder":
        if join_sql and join_sql.strip():
            self._join_clauses.append(join_sql.strip())
        return self

    def left_join(self, table: str, alias: str, on_condition: str) -> "NativeSqlBuilder":
        self._join_clauses.append(f"LEFT JOIN {table} {alias} ON {on_condition}")
        return self

    def inner_join(self, table: str, alias: str, on_condition: str) -> "NativeSqlBuilder":
        self._join_clauses.append(f"INNER JOIN {table} {alias} ON {on_condition}")
        return self

    # WHERE conditions
    def where(self, *args, **kwargs) -> "NativeSqlBuilder":
        """
        Flexible where condition:
        - where(column, value, operator="=", alias=None)
        - where(alias, column, operator, value)
        """
        self._root_where.where(*args, **kwargs)
        return self

    def where_like(self, column: str, value: Optional[str], match: LikeMatch = LikeMatch.CONTAINS, alias: Optional[str] = None) -> "NativeSqlBuilder":
        self._root_where.where_like(alias, column, value, match)
        return self

    def where_in(self, column: str, values: Optional[Union[List, Tuple, set]], alias: Optional[str] = None) -> "NativeSqlBuilder":
        self._root_where.where_in(alias, column, values)
        return self

    def where_between(self, column: str, from_val: Any, to_val: Any, alias: Optional[str] = None) -> "NativeSqlBuilder":
        self._root_where.where_between(alias, column, from_val, to_val)
        return self

    def where_null(self, column: str, alias: Optional[str] = None) -> "NativeSqlBuilder":
        self._root_where.where_null(alias, column)
        return self

    def where_not_null(self, column: str, alias: Optional[str] = None) -> "NativeSqlBuilder":
        self._root_where.where_not_null(alias, column)
        return self

    def where_exists(self, sub_query_sql: str) -> "NativeSqlBuilder":
        self._root_where.where_exists(sub_query_sql)
        return self

    def where_not_exists(self, sub_query_sql: str) -> "NativeSqlBuilder":
        self._root_where.where_not_exists(sub_query_sql)
        return self

    def where_raw(self, raw_condition: str) -> "NativeSqlBuilder":
        self._root_where.where_raw(raw_condition)
        return self

    def where_group(self, consumer: Callable[[ConditionGroup], None]) -> "NativeSqlBuilder":
        group = ConditionGroup("AND", self)
        consumer(group)
        if not group.is_empty():
            self._root_where.add_group(group)
        return self

    def where_or_group(self, consumer: Callable[[ConditionGroup], None]) -> "NativeSqlBuilder":
        group = ConditionGroup("OR", self)
        consumer(group)
        if not group.is_empty():
            self._root_where.add_group(group)
        return self

    def create_union_builder(self) -> "NativeSqlBuilder":
        return NativeSqlBuilder(self._param_counter, self._parameters)

    def union(self, other: "NativeSqlBuilder") -> "NativeSqlBuilder":
        self._unions.append(("UNION", other))
        return self

    def union_all(self, other: "NativeSqlBuilder") -> "NativeSqlBuilder":
        self._unions.append(("UNION ALL", other))
        return self

    def group_by(self, group_by_expr: str) -> "NativeSqlBuilder":
        self._group_by_clause = group_by_expr
        return self

    def having(self, having_expr: str) -> "NativeSqlBuilder":
        self._having_clause = having_expr
        return self

    def order_by(self, order_by_clause: str) -> "NativeSqlBuilder":
        self._order_by_clause = order_by_clause
        return self

    def order_by_col(self, column: str, direction: str = "ASC", alias: Optional[str] = None) -> "NativeSqlBuilder":
        validate_identifier(column)
        if alias:
            validate_identifier(alias)
        col = self.resolve_column(alias, column)
        dir_clean = "DESC" if direction and direction.upper() == "DESC" else "ASC"
        if not self._order_by_clause:
            self._order_by_clause = f"{col} {dir_clean}"
        else:
            self._order_by_clause += f", {col} {dir_clean}"
        return self

    def paginate(self, page: Optional[int], size: Optional[int]) -> "NativeSqlBuilder":
        if page is not None and size is not None and int(page) >= 0 and int(size) > 0:
            self._limit = int(size)
            self._offset = int(page) * int(size)
        return self

    def build_sql(self) -> str:
        if self._operation == "INSERT":
            return self.build_insert_sql()
        elif self._operation == "UPDATE":
            return self.build_update_sql()
        elif self._operation == "DELETE":
            return self.build_delete_sql()

        parts: List[str] = []
        if self._ctes:
            parts.append("WITH " + ",\n".join(self._ctes) + "\n")

        self._build_single_select(parts)

        for union_type, builder in self._unions:
            parts.append(f"\n{union_type}\n{builder.build_sql()}")

        if self._order_by_clause:
            parts.append(f"ORDER BY {self._order_by_clause}\n")

        if self._limit is not None:
            parts.append(f"LIMIT {self._limit} OFFSET {self._offset}\n")

        return "".join(parts)

    def build_count_sql(self) -> str:
        parts: List[str] = []
        if self._ctes:
            parts.append("WITH " + ",\n".join(self._ctes) + "\n")

        parts.append("SELECT COUNT(1) AS total_count\n")
        if self._from_clause:
            parts.append(f"FROM {self._from_clause}\n")
        for join in self._join_clauses:
            parts.append(f"{join}\n")

        where_sql = self._root_where.render()
        if where_sql:
            parts.append(f"WHERE {where_sql}\n")

        if self._group_by_clause:
            parts.append(f"GROUP BY {self._group_by_clause}\n")
            if self._having_clause:
                parts.append(f"HAVING {self._having_clause}\n")
            inner_sql = "".join(parts)
            return f"SELECT COUNT(1) AS total_count FROM ({inner_sql}) AS total_records"

        return "".join(parts)

    def _build_single_select(self, parts: List[str]) -> None:
        if self._select_clauses:
            prefix = "SELECT DISTINCT " if self._distinct else "SELECT "
            parts.append(prefix + ",\n  ".join(self._select_clauses) + "\n")
        if self._from_clause:
            parts.append(f"FROM {self._from_clause}\n")
        for join in self._join_clauses:
            parts.append(f"{join}\n")
        where_sql = self._root_where.render()
        if where_sql:
            parts.append(f"WHERE {where_sql}\n")
        if self._group_by_clause:
            parts.append(f"GROUP BY {self._group_by_clause}\n")
        if self._having_clause:
            parts.append(f"HAVING {self._having_clause}\n")

    # =========================================================================
    # EXECUTION
    # =========================================================================
    def get_parameters(self) -> Dict[str, Any]:
        return self._parameters

    def execute(self, cursor) -> Any:
        """Unified executor dispatching based on operation type."""
        if self._operation == "INSERT":
            return self.execute_insert(cursor)
        elif self._operation == "UPDATE":
            return self.execute_update(cursor)
        elif self._operation == "DELETE":
            return self.execute_delete(cursor)
        return self.fetch(cursor)

    def fetch(self, cursor) -> List[Dict[str, Any]]:
        sql = self.build_sql()
        cursor.execute(sql, self._parameters)
        return cursor.fetchall() or []

    def fetch_one(self, cursor) -> Optional[Dict[str, Any]]:
        self.paginate(0, 1)
        res = self.fetch(cursor)
        return res[0] if res else None

    def fetch_count(self, cursor) -> int:
        count_sql = self.build_count_sql()
        cursor.execute(count_sql, self._parameters)
        res = cursor.fetchone()
        if not res:
            return 0
        if isinstance(res, dict):
            val = next(iter(res.values()))
            return int(val or 0)
        return int(res[0] or 0)

    def fetch_page(self, cursor, page: int = 0, size: int = 10) -> Dict[str, Any]:
        total = self.fetch_count(cursor)
        if total == 0:
            return {"content": [], "page": page, "size": size, "total": 0, "totalPages": 0}
        self.paginate(page, size)
        content = self.fetch(cursor)
        total_pages = (total + size - 1) // size
        return {
            "content": content,
            "page": page,
            "size": size,
            "total": total,
            "totalPages": total_pages
        }

    # HELPER METHODS
    def register_param(self, val: Any) -> str:
        self._param_counter[0] += 1
        name = f"p_{self._param_counter[0]}"
        self._parameters[name] = val
        return name

    def resolve_column(self, alias: Optional[str], column: str) -> str:
        if not column or not column.strip():
            return ""
        c = column.strip()
        if "." in c or "(" in c:
            return c
        target_alias = alias.strip() if alias and alias.strip() else self._default_alias
        return f"{target_alias}.{c}" if target_alias else c
