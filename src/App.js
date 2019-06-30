import logo from './logo.svg';
import React, { Component } from 'react';
import axios from 'axios';
import { sortBy } from 'lodash';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import './App.css';

const DEFAULT_QUERY = 'redux';
const DEFAULT_HPP = '100';

const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';

const url = `${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${DEFAULT_QUERY}&${PARAM_PAGE}`;

const SORTS = {
  NONE: list => list,
  TITLE: list => sortBy(list, 'title'),
  AUTHOR: list => sortBy(list, 'author'),
  COMMENTS: list => sortBy(list, 'num_comments').reverse(),
  POINTS: list => sortBy(list, 'points').reverse(),
};

const Sort = ({
  sortKey,
  activeSortKey,
  onSort,
  children
}) => {
  const sortClass = classNames(
    'button-inline',
    { 'button-active': sortKey === activeSortKey }
);
  return (
    <Button
     onClick={() => onSort(sortKey)}
     className={sortClass}
>
{children}
</Button> );
}

const updateSearchTopStoriesState = (hits, page) => (prevState) => {
  const { searchKey, results } = prevState;
  const oldHits = results && results[searchKey]
    ? results[searchKey].hits
    : [];
  const updatedHits = [
    ...oldHits,
    ...hits
];
  return {
    results: {
...results,
      [searchKey]: { hits: updatedHits, page }
    },
    isLoading: false
  };
};

class App extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      results: null,
      searchKey: '',
      searchTerm: DEFAULT_QUERY,
      error: null,
      isLoading: false,
    };
  this.needsToSearchTopStories = this.needsToSearchTopStories.bind(this);
  this.setSearchTopStories = this.setSearchTopStories.bind(this);
  this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
  this.onSearchSubmit = this.onSearchSubmit.bind(this);
  this.onDismiss = this.onDismiss.bind(this);
  this.onSearchChange = this.onSearchChange.bind(this);
  }



  needsToSearchTopStories(searchTerm) {
    return !this.state.results[searchTerm];
}

  fetchSearchTopStories(searchTerm, page = 0) {
    this.setState({ isLoading: true });
    axios(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
      .then(result => this.setSearchTopStories(result.data))
      .catch(error => this.setState({ error }));
}

  onSearchChange(event) {
    this.setState({ searchTerm: event.target.value });
  }

  setSearchTopStories(result) {
    const { hits, page } = result;
    const { searchKey, results } = this.state;
    const oldHits = results && results[searchKey]
        ? results[searchKey].hits
        : [];
  const updatedHits = [
    ...oldHits,
    ...hits
];
this.setState(prevState => {
  const { searchKey, results } = prevState;
    const oldHits = results && results[searchKey]
      ? results[searchKey].hits
      : [];
    const updatedHits = [
      ...oldHits,
      ...hits
];
    return {
      results: {
...results,
        [searchKey]: { hits: updatedHits, page }
      },
      isLoading: false
    };
});

  }

  onSearchSubmit(event) {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });
    if (this.needsToSearchTopStories(searchTerm)) {
      this.fetchSearchTopStories(searchTerm);
}
    event.preventDefault();
  }

  componentWillUnmount() {
    this._isMounted = false;
}


  componentDidMount() {
    this._isMounted = true;

    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });
    this.fetchSearchTopStories(searchTerm);
  }

  onDismiss(id) {
   const { searchKey, results } = this.state;
   const { hits, page } = results[searchKey];
   const isNotId = item => item.objectID !== id;
   const updatedHits = hits.filter(isNotId);
   this.setState({
     results: {
       ...results,
       [searchKey]: { hits: updatedHits, page }
     }
});
  }

  render() {
    const {
     searchTerm,
     results,
     searchKey,
     error,
     isLoading
   } = this.state;

   const page = (
     results &&
     results[searchKey] &&
     results[searchKey].page
   ) || 0;
   const list = (
     results &&
     results[searchKey] &&
     results[searchKey].hits
   ) || [];

   if (error) {
      return <p>Что-то произошло не так.</p>;
    }
    return (
      <div className="page">
        <div className="interactions">
      <Search
        value={searchTerm}
        onChange={this.onSearchChange}
        onSubmit={this.onSearchSubmit}
        > Поиск
        </Search>
        </div>
        { error
         ? <div className="interactions">
           <p>Something went wrong.</p>
         </div>
         : <Table
          list={list}
          onDismiss={this.onDismiss}
          onSort={this.onSort}
           /> }
        <div className="interactions">
          <ButtonWithLoading
          isLoading={isLoading}
          onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}
        >
          Больше историй
        </ButtonWithLoading>
         </div>
      </div>
    );
      }
    }

    class Search extends Component {
      componentDidMount() {
    if (this.input) {
      this.input.focus();
    }
}
  render() {
    const {
      value,
      onChange,
      onSubmit,
      children
    } = this.props;
    return (
      <form onSubmit={onSubmit}>
        <input
          type="text"
          value={value}
          onChange={onChange}
          ref={(node) => { this.input = node; }}
       />
       <button type="submit">
         {children}
       </button>
     </form>
); }
}



class Table extends Component {
  constructor(props) {
    super(props);

    this.state = {
      sortKey: 'NONE',
      isSortReverse: false,
    };
    this.onSort = this.onSort.bind(this);
}
  onSort(sortKey) {
    const isSortReverse = this.state.sortKey === sortKey && !this.state.isSortReverse;
    this.setState({ sortKey, isSortReverse });
}

  render() {
    const { list,
          onDismiss
        } = this.props;
        const {
          sortKey,
          isSortReverse,
        } = this.state;
    const sortedList = SORTS[sortKey](list);
    const reverseSortedList = isSortReverse
      ? sortedList.reverse()
      : sortedList;
return (
    <div className="table">
    <div className="table-header">
      <span style={{ width: '40%' }}>
      <Sort
         sortKey={'TITLE'}
         onSort={this.onSort}
         activeSortKey={sortKey}
         > Заголовок
       </Sort>
     </span>
     <span style={{ width: '30%' }}>
       <Sort
         sortKey={'AUTHOR'}
         onSort={this.onSort}
         activeSortKey={sortKey}
       >
         Автор
       </Sort>
     </span>
     <span style={{ width: '10%' }}>
       <Sort
         sortKey={'COMMENTS'}
         onSort={this.onSort}
         activeSortKey={sortKey}
       >
         Комментарии
       </Sort>
     </span>
     <span style={{ width: '10%' }}>
       <Sort
         sortKey={'POINTS'}
         onSort={this.onSort}
         activeSortKey={sortKey}
       >
       Очки </Sort>
     </span>
     <span style={{ width: '10%' }}>
       Архив
     </span>
     </div>
      {reverseSortedList.map(item =>
            <div key={item.objectID} className="table-row">
            <span style={{ width: '40%' }}>
          <a href={item.url}>{item.title}</a>
          </span>
          <span style={{ width: '30%' }}>
            {item.author}
          </span>
          <span style={{ width: '10%' }}>
            {item.num_comments}
          </span>
          <span style={{ width: '10%' }}>
            {item.points}
          </span>
          <span style={{ width: '10%' }}>
            <Button
              onClick={() => onDismiss(item.objectID)}
              className="button-inline"
            >
            Отбросить
          </Button>
              </span>
              </div> )}
              </div>
            );
          }
        }


              const Button = ({
                onClick,
                className,
                children
              }) =>
            <button
                  onClick={onClick}
                  className={className}
                  type="button"
                  >
                  {children}
            </button>



Button.propTypes = {
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

Table.propTypes = {
  list: PropTypes.arrayOf(
    PropTypes.shape({
      objectID: PropTypes.string.isRequired,
      author: PropTypes.string,
      url: PropTypes.string,
      num_comments: PropTypes.number,
      points: PropTypes.number,
    })
  ).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

Button.defaultProps = {
  className: '',
};

const Loading = () => <div>Загрузка ...</div>


const withFoo = (Component) => (props) => <Component { ...props } />

const withLoading = (Component) => ({ isLoading, ...rest }) =>
  isLoading
    ? <Loading />
    : <Component { ...rest } />

    const ButtonWithLoading = withLoading(Button);

export default App;

export {
  Button,
  Search,
  Table,
};
