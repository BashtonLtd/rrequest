/*
 * rrequest
 * http://www.rrequest.com/
 * (C) Copyright Bashton Ltd, 2013
 *
 * This file is part of rrequest.
 *
 * rrequest is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * rrequest is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with rrequest.  If not, see <http://www.gnu.org/licenses/>.
 *
*/
sortByDate = function(obj1, obj2) {
  return new Date(obj2.created) < new Date(obj1.created) ? 1 : -1;
};

sortByDateString = function(obj1, obj2) {
    return new Date(obj2.created_at) < new Date(obj1.created_at) ? 1 : -1;
};

sortByName = function(obj1, obj2) {
  return obj2.name < obj1.name ? 1 : -1;
};
